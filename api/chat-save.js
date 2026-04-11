/**
 * POST /api/chat-save
 * Appends a message to the visitor_messages SSOT table.
 * Body: { visitor_id, email?, role, content, source }
 * No auth required — write-only, service role on the server.
 */
import { getServiceSupabase } from './lib/site-events-db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { visitor_id, email, role, content, source } = req.body || {}

  if (!visitor_id || !role || !content || !source) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const sb = getServiceSupabase()
  if (!sb) return res.status(503).json({ error: 'DB not configured' })

  const { error } = await sb.from('visitor_messages').insert({
    visitor_id,
    email: email || null,
    role,
    content,
    source,
  })

  if (error) {
    console.error('[chat-save]', error.message)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ ok: true })
}
