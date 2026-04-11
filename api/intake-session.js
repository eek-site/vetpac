/**
 * POST — create or update an intake session.
 *
 * Create:  { messages }                     → returns { token }
 * Update:  { token, messages, dogProfile?,
 *            healthHistory?, lifestyle?,
 *            ownerDetails?, aiAssessment?,
 *            status? }                       → returns { ok, token }
 *
 * Fire-and-forget safe — client ignores failures.
 */
import { handleCors } from './lib/cors.js'
import { getServiceSupabase } from './lib/site-events-db.js'

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

  const sb = getServiceSupabase()
  if (!sb) return res.status(503).json({ error: 'Storage not configured' })

  const email = ownerDetails?.email || null
  const dogName = dogProfile?.name || null
  const now = new Date().toISOString()

  try {
    if (!token) {
      // Create new session
      const { data, error } = await sb
        .from('intake_sessions')
        .insert({
          messages: messages || [],
          dog_profile: dogProfile || {},
          health_history: healthHistory || {},
          lifestyle: lifestyle || {},
          owner_details: ownerDetails || {},
          ai_assessment: aiAssessment || null,
          dog_name: dogName,
          email,
          status: status || 'in_progress',
        })
        .select('session_token')
        .single()

      if (error) {
        console.error('[intake-session create]', error.message)
        return res.status(500).json({ error: 'Could not create session' })
      }
      return res.status(200).json({ token: data.session_token })
    }

    // Update existing session
    const updates = { updated_at: now }
    if (messages !== undefined) updates.messages = messages
    if (dogProfile !== undefined) updates.dog_profile = dogProfile
    if (healthHistory !== undefined) updates.health_history = healthHistory
    if (lifestyle !== undefined) updates.lifestyle = lifestyle
    if (ownerDetails !== undefined) updates.owner_details = ownerDetails
    if (aiAssessment !== undefined) updates.ai_assessment = aiAssessment
    if (status !== undefined) updates.status = status
    if (email) updates.email = email
    if (dogName) updates.dog_name = dogName

    const { error } = await sb
      .from('intake_sessions')
      .update(updates)
      .eq('session_token', token)

    if (error) {
      console.error('[intake-session update]', error.message)
      return res.status(500).json({ error: 'Could not update session' })
    }
    return res.status(200).json({ ok: true, token })
  } catch (e) {
    console.error('[intake-session]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
