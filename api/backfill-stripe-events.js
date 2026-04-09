/**
 * One-time / occasional: insert site_events from Stripe Checkout Sessions (paid).
 * SPA routes are not in Vercel access logs; this is the main historical signal for "got past intake" (paid consult or order).
 */

import Stripe from 'stripe'
import { getServiceSupabase } from './lib/site-events-db.js'

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

  const auth = req.headers.authorization || ''
  const adminKey = process.env.ADMIN_KEY || ''
  if (!adminKey || auth !== `Bearer ${adminKey}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  const sb = getServiceSupabase()
  if (!secretKey) return res.status(503).json({ error: 'Stripe not configured' })
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' })

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
        if (session.payment_status !== 'paid') {
          skipped += 1
          continue
        }

        let lineItems = session.line_items
        if (!lineItems?.data?.length) {
          try {
            const full = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] })
            lineItems = full.line_items
          } catch {
            lineItems = { data: [] }
          }
        }

        const kind = classifyLineItems(lineItems)
        const dogName = session.metadata?.dog_name || ''

        const row = {
          event_type: 'stripe_checkout_paid',
          source: 'stripe_backfill',
          backfilled: true,
          created_at: new Date(session.created * 1000).toISOString(),
          meta: {
            stripe_session_id: session.id,
            kind,
            dog_name: dogName,
            amount_total: session.amount_total,
            currency: session.currency,
          },
        }

        const { error } = await sb.from('site_events').insert(row)
        if (error) {
          if (error.code === '23505') {
            skipped += 1
          } else {
            console.error('[backfill]', error.message)
          }
        } else {
          inserted += 1
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
