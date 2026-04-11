/**
 * POST { stripeSessionId } — called from the order confirmation page once
 * payment is confirmed. Updates the intake_session linked to this Stripe
 * session: sets order_status='paid' and records the stripe_session_id.
 */
import { handleCors } from './lib/cors.js'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { stripeSessionId, sessionToken } = req.body || {}
  if (!stripeSessionId) return res.status(400).json({ error: 'stripeSessionId required' })

  const sb = adminSupabase()
  if (!sb) return res.status(500).json({ error: 'Not configured' })

  try {
    // Verify the Stripe session is actually paid
    const secret = process.env.STRIPE_SECRET_KEY
    if (secret) {
      const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripeSessionId}`, {
        headers: { Authorization: `Bearer ${secret}` },
      })
      const session = await r.json()
      if (!r.ok || session.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Payment not confirmed' })
      }

      // Update intake_session — try by stripe_session_id first, then by session_token
      const update = { order_status: 'paid', stripe_session_id: stripeSessionId }

      let updated = false

      // Try matching by stripe_session_id already stored
      const { data: byStripe } = await sb
        .from('intake_sessions')
        .update(update)
        .eq('stripe_session_id', stripeSessionId)
        .select('id')
      if (byStripe?.length) updated = true

      // Fallback: match by session_token (passed from client)
      if (!updated && sessionToken) {
        await sb
          .from('intake_sessions')
          .update(update)
          .eq('session_token', sessionToken)
      }
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[save-order]', e)
    return res.status(500).json({ error: e.message })
  }
}
