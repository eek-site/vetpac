/**
 * GET /api/admin-intake-sessions          — list all sessions (newest first)
 * GET /api/admin-intake-sessions?id=TOKEN — fetch full detail for one session
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

  try {
    if (req.query.id) {
      const session = await prisma.intakeSession.findUnique({ where: { sessionToken: req.query.id } })
      if (!session) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json({ session })
    }

    const sessions = await prisma.intakeSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        sessionToken: true, email: true, dogName: true, status: true,
        createdAt: true, updatedAt: true, aiAssessment: true, ownerDetails: true,
      },
    })
    return res.status(200).json({ sessions })
  } catch (e) {
    console.error('[admin-intake-sessions]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
