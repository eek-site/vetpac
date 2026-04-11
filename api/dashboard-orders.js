/**
 * POST { email } — returns Stripe payment sessions for this customer.
 * Called from the authenticated dashboard; email comes from the Supabase JWT.
 * We verify the user's Supabase session before returning data.
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

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const sb = adminSupabase()
  if (!sb) return res.status(500).json({ error: 'Auth not configured' })

  const { data: { user }, error: authError } = await sb.auth.getUser(token)
  if (authError || !user?.email) {
    return res.status(401).json({ error: 'Invalid session' })
  }

  const email = user.email.toLowerCase()
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return res.status(500).json({ error: 'Stripe not configured' })

  try {
    // Search Stripe for payment sessions with this customer email
    const url = new URL('https://api.stripe.com/v1/checkout/sessions')
    url.searchParams.set('limit', '25')
    url.searchParams.set('status', 'complete')

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error?.message || 'Stripe error')

    const sessions = (data.data || []).filter((s) => {
      const sEmail = (s.customer_details?.email || s.customer_email || '').toLowerCase()
      return sEmail === email && s.payment_status === 'paid'
    })

    const orders = sessions.map((s) => {
      const meta = s.metadata || {}
      return {
        id: s.id.slice(0, 8).toUpperCase(),
        sessionId: s.id,
        status: 'confirmed',
        product: meta.dog_name ? `Vaccine plan — ${meta.dog_name}` : 'VetPac order',
        dog: meta.dog_name || '',
        total: (s.amount_total / 100).toFixed(2),
        date: new Date(s.created * 1000).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
      }
    })

    return res.status(200).json({ orders })
  } catch (e) {
    console.error('[dashboard-orders]', e)
    return res.status(500).json({ error: e.message || 'Could not load orders' })
  }
}
