/**
 * POST — create or update an intake session.
 *
 * Create:  { messages }                     → returns { token }
 * Update:  { token, messages, dogProfile?,
 *            healthHistory?, lifestyle?,
 *            ownerDetails?, aiAssessment?,
 *            status? }                       → returns { ok, token }
 */
import { handleCors } from './lib/cors.js'
import { prisma } from './lib/prisma.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    token,
    messages,
    dogProfile,
    healthHistory,
    lifestyle,
    ownerDetails,
    aiAssessment,
    status,
  } = req.body || {}

  const email = ownerDetails?.email || null
  const dogName = dogProfile?.name || null

  try {
    if (!token) {
      const session = await prisma.intakeSession.create({
        data: {
          messages: messages || [],
          dogProfile: dogProfile || {},
          healthHistory: healthHistory || {},
          lifestyle: lifestyle || {},
          ownerDetails: ownerDetails || {},
          aiAssessment: aiAssessment ?? null,
          dogName,
          email,
          status: status || 'in_progress',
        },
        select: { sessionToken: true },
      })
      return res.status(200).json({ token: session.sessionToken })
    }

    const updates = {}
    if (messages !== undefined) updates.messages = messages
    if (dogProfile !== undefined) updates.dogProfile = dogProfile
    if (healthHistory !== undefined) updates.healthHistory = healthHistory
    if (lifestyle !== undefined) updates.lifestyle = lifestyle
    if (ownerDetails !== undefined) updates.ownerDetails = ownerDetails
    if (aiAssessment !== undefined) updates.aiAssessment = aiAssessment
    if (status !== undefined) updates.status = status
    if (email) updates.email = email
    if (dogName) updates.dogName = dogName

    await prisma.intakeSession.update({ where: { sessionToken: token }, data: updates })
    return res.status(200).json({ ok: true, token })
  } catch (e) {
    console.error('[intake-session]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
