/**
 * One-time / occasional: insert site_events from Stripe Checkout Sessions (paid).
 */
import Stripe from 'stripe'
import { prisma } from './lib/prisma.js'
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'

export const maxDuration = 60

function classifyLineItems(lineItems) {
  const names = (lineItems?.data || []).map((li) => (li.description || li.price?.product?.name || '').toLowerCase())
  const blob = names.join(' ')
  if (blob.includes('consultation') || blob.includes('vet review')) return 'consult'
  if (blob.includes('vaccin') || blob.includes('freight') || blob.includes('assist') || blob.includes('cover')) return 'order'
  return 'unknown'
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return res.status(503).json({ error: 'Stripe not configured' })

  const stripe = new Stripe(secretKey)
  let inserted = 0
  let skipped = 0
  let pages = 0

  try {
    let startingAfter = undefined
    while (pages < 50) {
      pages += 1
      const batch = await stripe.checkout.sessions.list({
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.line_items'],
      })

      for (const session of batch.data) {
        if (session.payment_status !== 'paid') { skipped += 1; continue }

        let lineItems = session.line_items
        if (!lineItems?.data?.length) {
          try {
            const full = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] })
            lineItems = full.line_items
          } catch { lineItems = { data: [] } }
        }

        const kind = classifyLineItems(lineItems)
        const dogName = session.metadata?.dog_name || ''
        const createdAt = new Date(session.created * 1000)

        try {
          await prisma.siteEvent.create({
            data: {
              eventType: 'stripe_checkout_paid',
              source: 'stripe_backfill',
              backfilled: true,
              createdAt,
              meta: {
                stripe_session_id: session.id,
                kind,
                dog_name: dogName,
                amount_total: session.amount_total,
                currency: session.currency,
              },
            },
          })
          inserted += 1
        } catch (e) {
          if (e.code === 'P2002') { skipped += 1 }
          else { console.error('[backfill]', e.message) }
        }
      }

      if (!batch.has_more || batch.data.length === 0) break
      startingAfter = batch.data[batch.data.length - 1].id
    }

    return res.status(200).json({ ok: true, inserted, skipped, pages })
  } catch (e) {
    console.error('[backfill-stripe-events]', e)
    return res.status(500).json({ error: e.message || 'Backfill failed' })
  }
}
