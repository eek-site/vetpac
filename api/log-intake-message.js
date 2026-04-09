/**
 * Stores each intake chat turn (user + assistant) in Supabase.
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server.
 */

import { getServiceSupabase } from './lib/site-events-db.js'

function allowOrigin(origin) {
  if (!origin) return false
  try {
    const h = new URL(origin).hostname
    return (
      h === 'vetpac.nz' ||
      h === 'www.vetpac.nz' ||
      h === 'localhost' ||
      h.endsWith('.vercel.app')
    )
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!allowOrigin(req.headers.origin || '')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const sb = getServiceSupabase()
  if (!sb) {
    return res.status(503).json({ error: 'Server storage not configured (missing SUPABASE_SERVICE_ROLE_KEY)' })
  }

  const { session_id, role, content, turn_index } = req.body || {}
  if (!session_id || typeof session_id !== 'string' || session_id.length > 200) {
    return res.status(400).json({ error: 'Invalid session_id' })
  }
  if (role !== 'user' && role !== 'assistant') {
    return res.status(400).json({ error: 'Invalid role' })
  }
  if (typeof content !== 'string' || content.length < 1) {
    return res.status(400).json({ error: 'Invalid content' })
  }
  const ti = Number(turn_index)
  if (!Number.isFinite(ti) || ti < 0 || ti > 10_000) {
    return res.status(400).json({ error: 'Invalid turn_index' })
  }

  const safeContent = content.slice(0, 50_000)

  const { error } = await sb.from('intake_chat_messages').insert({
    session_id,
    role,
    turn_index: Math.floor(ti),
    content: safeContent,
  })

  if (error) {
    if (error.code === '23505') {
      return res.status(200).json({ ok: true, duplicate: true })
    }
    console.error('[log-intake-message]', error.message)
    return res.status(500).json({ error: 'Insert failed' })
  }

  return res.status(200).json({ ok: true })
}
