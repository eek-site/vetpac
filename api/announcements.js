/**
 * GET  /api/announcements          — public, returns currently active announcements
 * GET  /api/announcements?all=1    — admin only, returns all announcements
 * POST /api/announcements          — admin, create
 * PATCH /api/announcements?id=UUID — admin, update
 * DELETE /api/announcements?id=UUID — admin, delete
 */
import { getServiceSupabase } from './lib/site-events-db.js'
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'
import { createClient } from '@supabase/supabase-js'

function getAnonSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── Public GET — active announcements only ──────────────────────────────
  if (req.method === 'GET' && !req.query.all) {
    const sb = getAnonSupabase()
    if (!sb) return res.status(503).json({ error: 'DB not configured' })
    const { data, error } = await sb
      .from('announcements')
      .select('id, title, body, start_at, end_at')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ announcements: data || [] })
  }

  // ── All other methods require admin auth ────────────────────────────────
  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  const sb = getServiceSupabase()
  if (!sb) return res.status(503).json({ error: 'DB not configured' })

  // GET all (admin)
  if (req.method === 'GET' && req.query.all) {
    const { data, error } = await sb
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ announcements: data || [] })
  }

  // POST — create
  if (req.method === 'POST') {
    const { title, body, start_at, end_at } = req.body || {}
    if (!title || !body || !start_at || !end_at) {
      return res.status(400).json({ error: 'title, body, start_at and end_at are required' })
    }
    const { data, error } = await sb
      .from('announcements')
      .insert({ title, body, start_at, end_at })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ announcement: data })
  }

  // PATCH — update
  if (req.method === 'PATCH') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    const { title, body, start_at, end_at } = req.body || {}
    const updates = {}
    if (title    !== undefined) updates.title    = title
    if (body     !== undefined) updates.body     = body
    if (start_at !== undefined) updates.start_at = start_at
    if (end_at   !== undefined) updates.end_at   = end_at
    const { data, error } = await sb
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ announcement: data })
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    const { error } = await sb.from('announcements').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
