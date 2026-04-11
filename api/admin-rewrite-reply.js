/**
 * POST /api/admin-rewrite-reply
 * Rewrites an admin draft reply in VetPac's brand voice, informed by the conversation context.
 * Requires Microsoft JWT.
 */
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'
import { handleCors } from './lib/cors.js'

const SYSTEM = `You are a writing assistant for the VetPac team. VetPac is a premium at-home puppy vaccination service in New Zealand.

Rewrite the admin's draft reply to a customer so that it is:
- Warm, personal, and professional — like a knowledgeable friend
- Concise — no waffle, no corporate speak
- Correctly addressed to the customer by first name
- In keeping with VetPac's brand: reassuring, expert, caring about puppies
- Formatted as plain email text (no markdown, no bullet points unless natural)
- Ending warmly — "The VetPac team" or similar

Do not add information that wasn't in the draft or context. Do not make promises you can't confirm.
Return ONLY the rewritten message text — no subject line, no meta-commentary.`

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  const { draft, customerName, dogName, conversationSummary } = req.body || {}
  if (!draft) return res.status(400).json({ error: 'draft is required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' })

  const contextBlock = [
    customerName && `Customer: ${customerName}`,
    dogName      && `Dog: ${dogName}`,
    conversationSummary && `\nConversation summary:\n${conversationSummary}`,
  ].filter(Boolean).join('\n')

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: `${contextBlock ? `Context:\n${contextBlock}\n\n` : ''}Admin draft:\n${draft}`,
        }],
      }),
    })

    if (!r.ok) {
      const err = await r.text()
      console.error('[admin-rewrite-reply] Anthropic error:', err)
      return res.status(502).json({ error: 'AI unavailable' })
    }

    const data = await r.json()
    return res.status(200).json({ text: data.content[0].text })
  } catch (e) {
    console.error('[admin-rewrite-reply]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
