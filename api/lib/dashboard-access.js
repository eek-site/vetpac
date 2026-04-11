import { createClient } from '@supabase/supabase-js'

function admin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null
  const t = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null
  return t
}

/**
 * Register an email for dashboard access.
 * Tries dashboard_access table first; if it doesn't exist, silently succeeds
 * (intake_sessions / Stripe are used as fallback sources of truth).
 */
export async function registerDashboardEmail(email) {
  const e = normalizeEmail(email)
  const sb = admin()
  if (!e || !sb) {
    if (!sb) console.warn('[dashboard_access] SUPABASE_SERVICE_ROLE_KEY or URL missing — skip register')
    return { ok: false, error: 'not_configured' }
  }
  const { error } = await sb.from('dashboard_access').upsert({ email: e }, { onConflict: 'email' })
  if (error) {
    console.warn('[dashboard_access] upsert skipped:', error.message)
  }
  return { ok: true }
}

/**
 * Check whether an email should be granted dashboard access.
 *
 * Priority:
 *  1. dashboard_access table  (explicit whitelist — populated after orders)
 *  2. intake_sessions table   (email completed intake — covers intake users)
 *  3. Stripe completed orders (email paid — covers customers who skipped intake)
 *
 * If all three fail, denies access.
 */
export async function emailHasDashboardAccess(email) {
  const e = normalizeEmail(email)
  const sb = admin()
  if (!e || !sb) return false

  // 1. dashboard_access whitelist
  try {
    const { data, error } = await sb.from('dashboard_access').select('email').eq('email', e).maybeSingle()
    if (!error && data?.email) return true
  } catch {
    // table missing — fall through
  }

  // 2. intake_sessions — check both the direct email column AND owner_details->>'email'
  try {
    const { data: byCol } = await sb
      .from('intake_sessions')
      .select('id')
      .eq('email', e)
      .limit(1)
      .maybeSingle()
    if (byCol?.id) return true

    const { data: byJson } = await sb
      .from('intake_sessions')
      .select('id')
      .filter('owner_details->>email', 'eq', e)
      .limit(1)
      .maybeSingle()
    if (byJson?.id) return true
  } catch (err) {
    console.error('[emailHasDashboardAccess] intake_sessions error:', err.message)
  }

  // 3. Stripe — any completed paid session for this email
  try {
    const secret = process.env.STRIPE_SECRET_KEY
    if (secret) {
      const url = new URL('https://api.stripe.com/v1/checkout/sessions')
      url.searchParams.set('customer_email', e)
      url.searchParams.set('status', 'complete')
      url.searchParams.set('limit', '1')
      const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${secret}` } })
      if (r.ok) {
        const d = await r.json()
        const paid = (d.data || []).some((s) => s.payment_status === 'paid')
        if (paid) {
          // Auto-register for faster future lookups
          await registerDashboardEmail(e).catch(() => {})
          return true
        }
      }
    }
  } catch (err) {
    console.error('[emailHasDashboardAccess] Stripe error:', err.message)
  }

  return false
}
