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

  try {
    const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const cutoff7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [total, last30, last7, byType] = await Promise.all([
      prisma.siteEvent.count(),
      prisma.siteEvent.count({ where: { createdAt: { gte: cutoff30 } } }),
      prisma.siteEvent.count({ where: { createdAt: { gte: cutoff7 } } }),
      prisma.siteEvent.groupBy({ by: ['eventType'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    ])

    return res.status(200).json({
      stats: {
        total_events: total,
        events_last_30_days: last30,
        events_last_7_days: last7,
        by_type: Object.fromEntries(byType.map((r) => [r.eventType, r._count.id])),
      },
    })
  } catch (e) {
    console.error('[admin-site-stats]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
