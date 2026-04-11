/**
 * GET /api/visitor-messages
 * Returns all visitor_messages grouped by visitor_id, sorted by last activity desc.
 * Requires Microsoft JWT (admin only).
 */
import { getServiceSupabase } from './lib/site-events-db.js'
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  const sb = getServiceSupabase()
  if (!sb) return res.status(503).json({ error: 'DB not configured' })

  const { data, error } = await sb
    .from('visitor_messages')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  // Group by visitor_id, newest visitor first
  const map = new Map()
  for (const row of data || []) {
    if (!map.has(row.visitor_id)) {
      map.set(row.visitor_id, {
        visitor_id: row.visitor_id,
        email: null,
        last_active: row.created_at,
        messages: [],
      })
    }
    const v = map.get(row.visitor_id)
    v.messages.push(row)
    if (row.created_at > v.last_active) v.last_active = row.created_at
    if (row.email && !v.email) v.email = row.email
  }

  const visitors = [...map.values()].sort(
    (a, b) => new Date(b.last_active) - new Date(a.last_active)
  )

  return res.status(200).json({ visitors })
}
