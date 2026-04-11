/**
 * GET /api/visitor-messages
 * Returns all visitor_messages grouped by visitor_id, admin only.
 */
import { prisma } from './lib/prisma.js'
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  const messages = await prisma.visitorMessage.findMany({ orderBy: { createdAt: 'asc' } })

  const map = new Map()
  for (const row of messages) {
    if (!map.has(row.visitorId)) {
      map.set(row.visitorId, { visitor_id: row.visitorId, email: null, last_active: row.createdAt, messages: [] })
    }
    const v = map.get(row.visitorId)
    v.messages.push(row)
    if (row.createdAt > v.last_active) v.last_active = row.createdAt
    if (row.email && !v.email) v.email = row.email
  }

  const visitors = [...map.values()].sort((a, b) => new Date(b.last_active) - new Date(a.last_active))
  return res.status(200).json({ visitors })
}
