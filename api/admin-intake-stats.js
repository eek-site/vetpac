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
    const [total, completed, paid, last30] = await Promise.all([
      prisma.intakeSession.count(),
      prisma.intakeSession.count({ where: { status: { in: ['complete', 'review_complete'] } } }),
      prisma.intakeSession.count({ where: { orderStatus: 'paid' } }),
      prisma.intakeSession.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ])

    return res.status(200).json({
      stats: { total_sessions: total, completed_sessions: completed, paid_sessions: paid, sessions_last_30_days: last30 },
    })
  } catch (e) {
    console.error('[admin-intake-stats]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
