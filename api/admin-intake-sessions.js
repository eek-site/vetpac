/**
 * GET /api/admin-intake-sessions          — list all sessions (newest first)
 * GET /api/admin-intake-sessions?id=UUID  — fetch full detail for one session
 *
 * Requires valid Microsoft JWT (same as other admin routes).
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
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' })

  const sessionId = req.query.id

  try {
    if (sessionId) {
      // Full detail for a single session
      const { data, error } = await sb
        .from('intake_sessions')
        .select('*')
        .eq('session_token', sessionId)
        .single()

      if (error || !data) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json({ session: data })
    }

    // List — no message bodies to keep payload small
    const { data, error } = await sb
      .from('intake_sessions')
      .select('session_token, email, dog_name, status, created_at, updated_at, ai_assessment, owner_details')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('[admin-intake-sessions]', error.message)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ sessions: data || [] })
  } catch (e) {
    console.error('[admin-intake-sessions]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
