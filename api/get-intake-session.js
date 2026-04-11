/**
 * GET /api/get-intake-session?token=UUID
 * Returns the saved intake session for client-side resume.
 */
import { handleCors } from './lib/cors.js'
import { prisma } from './lib/prisma.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.query.token
  if (!token || typeof token !== 'string' || token.length > 40) {
    return res.status(400).json({ error: 'Missing or invalid token' })
  }

  try {
    const session = await prisma.intakeSession.findUnique({
      where: { sessionToken: token },
      select: {
        sessionToken: true, status: true, messages: true,
        dogProfile: true, healthHistory: true, lifestyle: true,
        ownerDetails: true, aiAssessment: true, createdAt: true, updatedAt: true,
      },
    })

    if (!session) return res.status(404).json({ error: 'Session not found' })

    return res.status(200).json({
      token: session.sessionToken,
      status: session.status,
      messages: session.messages || [],
      dogProfile: session.dogProfile || {},
      healthHistory: session.healthHistory || {},
      lifestyle: session.lifestyle || {},
      ownerDetails: session.ownerDetails || {},
      aiAssessment: session.aiAssessment || null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    })
  } catch (e) {
    console.error('[get-intake-session]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
