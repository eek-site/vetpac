import { prisma } from './prisma.js'

export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null
  const t = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null
  return t
}

export async function registerDashboardEmail(email) {
  const e = normalizeEmail(email)
  if (!e) return { ok: false, error: 'invalid_email' }
  try {
    await prisma.dashboardAccess.upsert({
      where: { email: e },
      update: {},
      create: { email: e },
    })
    return { ok: true }
  } catch (err) {
    console.warn('[dashboard_access] upsert skipped:', err.message)
    return { ok: false, error: err.message }
  }
}

export async function emailHasDashboardAccess(email) {
  const e = normalizeEmail(email)
  if (!e) return false

  // 1. Explicit whitelist
  try {
    const row = await prisma.dashboardAccess.findUnique({ where: { email: e } })
    if (row) return true
  } catch { /* table may not exist yet */ }

  // 2. intake_sessions — check owner email
  try {
    const session = await prisma.intakeSession.findFirst({
      where: {
        OR: [
          { email: e },
          { ownerDetails: { path: ['email'], equals: e } },
        ],
      },
      select: { id: true },
    })
    if (session) return true
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
