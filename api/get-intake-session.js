/**
 * GET /api/get-intake-session?token=UUID
 * Returns the saved intake session for client-side resume.
 */
import { handleCors } from './lib/cors.js'
import { getServiceSupabase } from './lib/site-events-db.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.query.token
  if (!token || typeof token !== 'string' || token.length > 40) {
    return res.status(400).json({ error: 'Missing or invalid token' })
  }

  const sb = getServiceSupabase()
  if (!sb) return res.status(503).json({ error: 'Storage not configured' })

  try {
    const { data, error } = await sb
      .from('intake_sessions')
      .select('session_token, status, messages, dog_profile, health_history, lifestyle, owner_details, ai_assessment, created_at, updated_at')
      .eq('session_token', token)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Session not found' })

    return res.status(200).json({
      token: data.session_token,
      status: data.status,
      messages: data.messages || [],
      dogProfile: data.dog_profile || {},
      healthHistory: data.health_history || {},
      lifestyle: data.lifestyle || {},
      ownerDetails: data.owner_details || {},
      aiAssessment: data.ai_assessment || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    })
  } catch (e) {
    console.error('[get-intake-session]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
