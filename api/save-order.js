/**
 * POST { stripeSessionId } — called from the order confirmation page once
 * payment is confirmed. Updates the linked intake session to 'paid'.
 */
import { handleCors } from './lib/cors.js'
import { prisma } from './lib/prisma.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { stripeSessionId, sessionToken } = req.body || {}
  if (!stripeSessionId) return res.status(400).json({ error: 'stripeSessionId required' })

  try {
    const secret = process.env.STRIPE_SECRET_KEY
    if (secret) {
      const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripeSessionId}`, {
        headers: { Authorization: `Bearer ${secret}` },
      })
      const session = await r.json()
      if (!r.ok || session.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Payment not confirmed' })
      }

      const update = { orderStatus: 'paid', stripeSessionId }

      // Try by stripeSessionId first
      const updated = await prisma.intakeSession.updateMany({
        where: { stripeSessionId },
        data: update,
      })

      // Fallback: match by sessionToken
      if (!updated.count && sessionToken) {
        await prisma.intakeSession.updateMany({ where: { sessionToken }, data: update })
      }
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[save-order]', e)
    return res.status(500).json({ error: e.message })
  }
}
