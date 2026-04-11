/**
 * POST — returns orders for the authenticated user.
 */
import { handleCors } from './lib/cors.js'
import { prisma } from './lib/prisma.js'
import { requireSession } from './lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireSession(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error, code: 'SESSION_EXPIRED' })
  const email = auth.email

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return res.status(500).json({ error: 'Stripe not configured' })

  const orders = []

  // 1. Stripe orders
  try {
    const url = new URL('https://api.stripe.com/v1/checkout/sessions')
    url.searchParams.set('limit', '100')
    url.searchParams.set('status', 'complete')
    url.searchParams.set('customer_email', email)
    url.searchParams.append('expand[]', 'data.payment_intent')

    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${secret}` } })
    const data = await r.json()
    if (r.ok) {
      for (const s of (data.data || []).filter((s) => s.payment_status === 'paid')) {
        const meta = s.metadata || {}
        const pi = typeof s.payment_intent === 'object' ? s.payment_intent : null
        orders.push({
          id: s.id.slice(0, 8).toUpperCase(),
          sessionId: s.id,
          status: 'confirmed',
          product: meta.dog_name ? `Vaccine plan — ${meta.dog_name}` : 'VetPac order',
          dog: meta.dog_name || '',
          total: (s.amount_total / 100).toFixed(2),
          date: new Date(s.created * 1000).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
          receiptUrl: pi?.charges?.data?.[0]?.receipt_url || null,
          source: 'stripe',
        })
      }
    }
  } catch (e) {
    console.error('[dashboard-orders] Stripe error:', e)
  }

  // 2. Fallback: intake_sessions — paid/complete sessions not in Stripe results
  try {
    const sessions = await prisma.intakeSession.findMany({
      where: {
        OR: [{ email }, { ownerDetails: { path: ['email'], equals: email } }],
        status: { in: ['complete', 'paid'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, sessionToken: true, dogName: true, status: true, ownerDetails: true, createdAt: true },
    })

    for (const s of sessions) {
      const dogName = s.dogName || s.ownerDetails?.dog_name || ''
      const alreadyCovered = orders.some((o) => o.dog === dogName && o.source === 'stripe')
      if (!alreadyCovered) {
        orders.push({
          id: s.sessionToken?.slice(0, 8).toUpperCase() || s.id.slice(0, 8).toUpperCase(),
          sessionId: s.id,
          status: 'consultation',
          product: dogName ? `Consultation — ${dogName}` : 'VetPac consultation',
          dog: dogName,
          total: '49.00',
          date: new Date(s.createdAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
          receiptUrl: null,
          source: 'intake',
        })
      }
    }
  } catch (e) {
    console.warn('[dashboard-orders] intake fallback failed:', e.message)
  }

  return res.status(200).json({ orders })
}
