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

/** Called from trusted server routes only (e.g. after order email sent). */
export async function registerDashboardEmail(email) {
  const e = normalizeEmail(email)
  const sb = admin()
  if (!e || !sb) {
    if (!sb) console.warn('[dashboard_access] SUPABASE_SERVICE_ROLE_KEY or URL missing — skip register')
    return { ok: false, error: 'not_configured' }
  }
  const { error } = await sb.from('dashboard_access').upsert({ email: e }, { onConflict: 'email' })
  if (error) {
    console.error('[dashboard_access] upsert error:', error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function emailHasDashboardAccess(email) {
  const e = normalizeEmail(email)
  const sb = admin()
  if (!e || !sb) return false
  const { data, error } = await sb.from('dashboard_access').select('email').eq('email', e).maybeSingle()
  if (error) {
    console.error('[dashboard_access] select error:', error.message)
    return false
  }
  return !!data?.email
}
