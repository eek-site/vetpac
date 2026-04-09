/**
 * POST { sessionId } — verifies Stripe Checkout Session is paid, registers customer email for dashboard login.
 * Used when returning from consult payment to /plan?paid=1&session_id=...
 */

import { registerDashboardEmail } from './lib/dashboard-access.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionId } = req.body || {}
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId required' })
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return res.status(500).json({ error: 'Stripe not configured' })

  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const session = await r.json()
    if (!r.ok) throw new Error(session.error?.message || 'Stripe lookup failed')
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Session not paid' })
    }

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      null
    if (!email) {
      return res.status(400).json({ error: 'No email on session' })
    }

    const out = await registerDashboardEmail(email)
    if (!out.ok) return res.status(500).json({ error: out.error || 'Could not register' })
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[register-dashboard-access]', e)
    return res.status(500).json({ error: e.message })
  }
}
