/**
 * POST /api/send-payment-instructions
 * Sends WhatsApp template `eek_payment_instructions` (business-initiated — works even when
 * the customer has not messaged in the last 24h; free-form session messages do not).
 *
 * Body: { phone, payeeName, accountNumber, jobReference }
 * Auth: Bearer Microsoft token (same as other admin APIs)
 */

import { sendPaymentInstructions, isConfigured } from './lib/whatsapp.js'
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'
import { handleCors } from './lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  if (!isConfigured()) {
    return res.status(503).json({ error: 'WhatsApp not configured' })
  }

  const { phone, payeeName, accountNumber, jobReference } = req.body || {}
  if (!phone || !payeeName || !accountNumber || !jobReference) {
    return res.status(400).json({
      error: 'Missing phone, payeeName, accountNumber, or jobReference',
    })
  }

  const result = await sendPaymentInstructions(phone, payeeName, accountNumber, jobReference)
  if (!result.success) {
    return res.status(502).json(result)
  }
  return res.status(200).json(result)
}
