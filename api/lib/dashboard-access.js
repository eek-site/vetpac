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
 * (intake_sessions is used as the fallback source of truth in emailHasDashboardAccess).
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
    // Table may not exist yet — non-fatal, intake_sessions serves as fallback
    console.warn('[dashboard_access] upsert skipped:', error.message)
  }
  return { ok: true }
}

/**
 * Check whether an email should be granted dashboard access.
 *
 * Priority:
 *  1. dashboard_access table (explicit whitelist — used after orders)
 *  2. intake_sessions table  (email completed intake — covers test/first users)
 *
 * If both tables are unavailable, denies access.
 */
export async function emailHasDashboardAccess(email) {
  const e = normalizeEmail(email)
  const sb = admin()
  if (!e || !sb) return false

  // 1. Try dashboard_access whitelist
  try {
    const { data, error } = await sb.from('dashboard_access').select('email').eq('email', e).maybeSingle()
    if (!error && data?.email) return true
    // If error here it's likely the table doesn't exist — fall through
    if (error && !error.message?.includes('does not exist') && !error.code?.includes('42P01')) {
      console.error('[dashboard_access] select error:', error.message)
    }
  } catch {
    // table access failed — fall through to intake_sessions
  }

  // 2. Fall back to intake_sessions — anyone who completed intake can sign in
  try {
    const { data, error } = await sb
      .from('intake_sessions')
      .select('email')
      .eq('email', e)
      .limit(1)
      .maybeSingle()
    if (!error && data?.email) return true
  } catch (err) {
    console.error('[emailHasDashboardAccess] intake_sessions fallback error:', err.message)
  }

  return false
}
