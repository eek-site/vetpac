/**
 * POST { messages: [{role, content}] }
 * Proxies the floating contact chat to Anthropic — keeps the API key server-side.
 */
import { handleCors } from './lib/cors.js'

const CONTACT_CHAT_PROMPT = `You are a friendly, knowledgeable concierge for VetPac — New Zealand's premium at-home puppy vaccination service. You handle enquiries with warmth and competence.

You can confidently answer questions about:
- How the service works (conversational AI intake → consultation fee → personalised plan → vaccines administered at home or self-administered)
- Pricing: consultation fee varies by NZ region (Auckland $49 to match competition, Wellington $289 top, others income-scaled $149–$245). Each vaccine $89. VetPac Assist (in-home vaccinator) $149/visit. Cold-chain freight $119/shipment. Multi-puppy: 18% compound discount per additional puppy, min $48.
- Vaccines offered: C3, C5 (core), Leptospirosis, Kennel Cough
- Safety: your home has none of the pathogens in a clinic waiting room. Vaccines are sealed, sterile, single-use. 24/7 support line.
- Coverage: all of New Zealand including rural
- Insurance: VetPac 2-Year Puppy Cover — monthly $24.99, annual $259, 2-year upfront $489 (excess halved to $750)
- The vaccination certificate is official and accepted by boarding facilities, groomers, and vets

You do NOT discuss: internal business operations, vet licensing details, VOI framework, legislation, or anything that isn't relevant to the customer experience.

If someone has a specific complaint, issue, or needs to speak to the team, collect their details and signal escalation.

When you are ready to send their enquiry to the team (because they want human follow-up, have a complaint, or a question you can't fully resolve), include this marker at the end of your message:

CONTACT_SUBMIT:{"name":"","email":"","phone":"","message":""}

Fill in what they've told you. Only include CONTACT_SUBMIT when the person explicitly wants to be contacted by the team. Most questions you should answer directly.`

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages } = req.body || {}
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' })
  }

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
        system: CONTACT_CHAT_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[ai-contact-chat] Anthropic error:', err)
      return res.status(502).json({ error: 'AI unavailable' })
    }

    const data = await response.json()
    return res.status(200).json({ text: data.content[0].text })
  } catch (e) {
    console.error('[ai-contact-chat]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
