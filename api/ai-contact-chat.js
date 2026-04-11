/**
 * POST { messages: [{role, content}] }
 * Proxies the floating contact chat to Anthropic — keeps the API key server-side.
 */
import { handleCors } from './lib/cors.js'
import { notifyTeam } from './lib/notify-team.js'

const CONTACT_CHAT_PROMPT = `You are a friendly, knowledgeable concierge for VetPac — New Zealand's at-home puppy vaccination service. You handle enquiries with warmth and confidence.

## Current pricing (always use these exact figures)
- Consultation fee: $49 flat — all regions of New Zealand
- Vaccines: C3 $89, C5 $89, Leptospirosis $89, Kennel Cough $89
- VetPac Assist (trained technician visits your home): $229 per visit — nationwide
  - For self-administer customers: their first dose includes a free technician visit to teach them how
- Cold-chain freight (self-administer): $119 per shipment
- Multi-puppy: 18% compound discount per additional puppy, minimum $49 per puppy
- Programme Warranty: $225 one-time — covers vaccine failure and adverse reactions during the programme. Zero service fee. Not a subscription.
- Worming: $29, Flea treatment: $34
- VetPac Digital Scales: free with first order (retail $49)

## How it works
1. AI-assisted intake questionnaire — puppy health, lifestyle, breed
2. NZ-registered vet reviews and authorises a personalised vaccination plan
3. Vaccines cold-chain shipped to your door (or technician brings them)
4. First dose: a VetPac trainer hand-delivers the kit and walks through administration (included)
5. Subsequent doses: self-administered with step-by-step guide + 24/7 chat support
6. Official vaccination certificate issued on completion

## What you can answer
- How the service works, what to expect at each step
- Specific vaccine questions (C3, C5, Lepto, Kennel Cough — what they cover, when they're given)
- Safety: at-home is often safer than a waiting room for unvaccinated puppies
- All of New Zealand covered including rural
- The vaccination certificate is official — accepted by boarding, groomers, vets
- Programme Warranty — covers vaccine non-response and adverse reactions, priced from peer-reviewed failure rate data

## What you do NOT discuss
Internal operations, vet licensing, VOI framework, legislation, or anything irrelevant to the customer.

## If the person has a question about their specific plan
Answer using the context provided below (if available). Be specific — use the puppy's name, reference their actual selected vaccines, their current step, etc.

## Escalation
If someone wants human follow-up, has a complaint, or asks something you can't fully resolve, collect their details and include this marker:

CONTACT_SUBMIT:{"name":"","email":"","phone":"","message":""}

Fill in what they've told you. Only include CONTACT_SUBMIT when they explicitly want the team to contact them.`

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, context } = req.body || {}
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' })
  }

  const contextBlock = context ? `\n\n## Current customer session\n${context}` : ''
  const systemPrompt = CONTACT_CHAT_PROMPT + contextBlock

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[ai-contact-chat] Anthropic error:', err)
      return res.status(502).json({ error: 'AI unavailable' })
    }

    const data = await response.json()
    const text = data.content[0].text

    // Notify team when customer explicitly asks for a follow-up
    if (text.includes('CONTACT_SUBMIT:')) {
      try {
        const match = text.match(/CONTACT_SUBMIT:(\{.*?\})/)
        if (match) {
          const contact = JSON.parse(match[1])
          notifyTeam({
            subject: `VetPac chat escalation — ${contact.name || 'Customer needs help'}`,
            heading: 'Chat escalation — customer wants contact',
            badgeText: 'ACTION',
            badgeColor: '#b45309',
            rows: [
              { label: 'Name',    value: contact.name    || '—' },
              { label: 'Email',   value: contact.email   || '—' },
              { label: 'Phone',   value: contact.phone   || '—' },
              { label: 'Message', value: contact.message || '—' },
            ],
          }).catch(() => {})
        }
      } catch { /* non-blocking */ }
    }

    return res.status(200).json({ text })
  } catch (e) {
    console.error('[ai-contact-chat]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
