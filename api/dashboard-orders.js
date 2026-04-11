/**
 * POST — returns orders for the authenticated user.
 * Verifies Supabase session, then looks up:
 *   1. Stripe checkout sessions (by customer_email)
 *   2. intake_sessions table (as fallback / pending orders)
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
  if (!token) return res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' })

  const sb = adminSupabase()
  if (!sb) return res.status(500).json({ error: 'Auth not configured' })

  let email
  try {
    const { data: { user }, error: authError } = await sb.auth.getUser(token)
    if (authError || !user?.email) {
      return res.status(401).json({ error: 'Session expired — please sign in again.', code: 'SESSION_EXPIRED' })
    }
    email = user.email.toLowerCase()
  } catch (e) {
    console.error('[dashboard-orders] auth error:', e)
    return res.status(401).json({ error: 'Session expired — please sign in again.', code: 'SESSION_EXPIRED' })
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return res.status(500).json({ error: 'Stripe not configured' })

  const orders = []

  // 1. Stripe orders — filter by customer_email (set on sessions created after this fix)
  try {
    const url = new URL('https://api.stripe.com/v1/checkout/sessions')
    url.searchParams.set('limit', '100')
    url.searchParams.set('status', 'complete')
    url.searchParams.set('customer_email', email)
    url.searchParams.append('expand[]', 'data.payment_intent')

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const data = await r.json()
    if (r.ok) {
      const sessions = (data.data || []).filter((s) => s.payment_status === 'paid')
      for (const s of sessions) {
        const meta = s.metadata || {}
        const pi = typeof s.payment_intent === 'object' ? s.payment_intent : null
        const receiptUrl = pi?.charges?.data?.[0]?.receipt_url || null
        orders.push({
          id: s.id.slice(0, 8).toUpperCase(),
          sessionId: s.id,
          status: 'confirmed',
          product: meta.dog_name ? `Vaccine plan — ${meta.dog_name}` : 'VetPac order',
          dog: meta.dog_name || '',
          total: (s.amount_total / 100).toFixed(2),
          date: new Date(s.created * 1000).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
          receiptUrl,
          source: 'stripe',
        })
      }
    } else {
      console.warn('[dashboard-orders] Stripe query failed:', data.error?.message)
    }
  } catch (e) {
    console.error('[dashboard-orders] Stripe error:', e)
  }

  // 2. Fallback: intake_sessions — show paid/complete sessions not already in Stripe results
  try {
    const { data: sessions, error } = await sb
      .from('intake_sessions')
      .select('id, session_token, dog_name, status, owner_details, created_at')
      .filter('owner_details->>email', 'eq', email)
      .in('status', ['complete', 'paid'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && sessions?.length) {
      for (const s of sessions) {
        const dogName = s.dog_name || s.owner_details?.dog_name || ''
        // Only show consultation entries if not already covered by a Stripe order
        const alreadyCovered = orders.some((o) => o.dog === dogName && o.source === 'stripe')
        if (!alreadyCovered) {
          orders.push({
            id: s.session_token?.slice(0, 8).toUpperCase() || s.id.slice(0, 8).toUpperCase(),
            sessionId: s.id,
            status: 'consultation',
            product: dogName ? `Consultation — ${dogName}` : 'VetPac consultation',
            dog: dogName,
            total: '49.00',
            date: new Date(s.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
            receiptUrl: null,
            source: 'intake',
          })
        }
      }
    }
  } catch (e) {
    // intake_sessions table may not exist — non-fatal
    console.warn('[dashboard-orders] intake_sessions fallback failed:', e.message)
  }

  return res.status(200).json({ orders })
}
