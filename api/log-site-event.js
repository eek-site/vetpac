/**
 * Lightweight analytics POST (service role insert). Origin-restricted.
 * Event types: intake_page_view, intake_user_message, intake_completed, contact_ai_message, treatment_plan_generated
 */

import { getServiceSupabase } from './lib/site-events-db.js'

const ALLOWED = new Set([
  'intake_page_view',
  'intake_user_message',
  'intake_completed',
  'contact_ai_message',
  'treatment_plan_generated',
])

function allowOrigin(origin) {
  if (!origin) return false
  try {
    const h = new URL(origin).hostname
    return (
      h === 'vetpac.nz' ||
      h === 'www.vetpac.nz' ||
      h === 'localhost' ||
      h.endsWith('.vercel.app')
    )
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const origin = req.headers.origin || ''
  if (!allowOrigin(origin)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const sb = getServiceSupabase()
  if (!sb) return res.status(503).json({ error: 'Analytics not configured' })

  const { event_type, meta } = req.body || {}
  if (!event_type || !ALLOWED.has(event_type)) {
    return res.status(400).json({ error: 'Invalid event_type' })
  }

  const safeMeta =
    meta && typeof meta === 'object' && !Array.isArray(meta)
      ? Object.fromEntries(Object.entries(meta).slice(0, 20).map(([k, v]) => [String(k).slice(0, 64), v]))
      : {}

  const { error } = await sb.from('site_events').insert({
    event_type,
    source: 'client',
    meta: safeMeta,
    backfilled: false,
  })

  if (error) {
    console.error('[log-site-event]', error.message)
    return res.status(500).json({ error: 'Insert failed' })
  }

  return res.status(200).json({ ok: true })
}
