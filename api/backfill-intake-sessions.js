/**
 * POST /api/backfill-intake-sessions
 * Reconstructs intake_sessions rows from the raw intake_chat_messages log.
 *
 * What the log contains:
 *   - Every user message (verbatim)
 *   - Every assistant message with INTAKE_COMPLETE JSON replaced by [INTAKE_COMPLETE_REDACTED]
 *
 * What we recover:
 *   - Full conversation array per session
 *   - Email address (regex from user messages)
 *   - Completion status (joined against site_events intake_completed)
 *   - Approximate dog name from first user message (first word / two words)
 *
 * Idempotent — sessions already in intake_sessions (by legacy_session_id) are skipped.
 * Requires Microsoft JWT (same as other admin routes).
 */
import { getServiceSupabase } from './lib/site-events-db.js'
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/

function extractEmail(messages) {
  for (const m of messages) {
    if (m.role !== 'user') continue
    const match = m.content.match(EMAIL_RE)
    if (match) return match[0].toLowerCase()
  }
  return null
}

/** Rough heuristic — first user message is usually "puppy name + breed" */
function extractDogName(messages) {
  for (const m of messages) {
    if (m.role !== 'user') continue
    const text = m.content.trim()
    if (text.length < 100) {
      // Take the first one or two words as a candidate name
      const words = text.split(/\s+/)
      return words.slice(0, 2).join(' ')
    }
    break
  }
  return null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  const sb = getServiceSupabase()
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' })

  try {
    // 1. Get all distinct session_ids that haven't been imported yet
    const { data: existing, error: e0 } = await sb
      .from('intake_sessions')
      .select('legacy_session_id')
      .not('legacy_session_id', 'is', null)

    if (e0) return res.status(500).json({ error: e0.message })
    const alreadyImported = new Set((existing || []).map((r) => r.legacy_session_id))

    // 2. Pull all chat messages, ordered by session + turn
    const { data: rows, error: e1 } = await sb
      .from('intake_chat_messages')
      .select('session_id, turn_index, role, content, created_at')
      .order('session_id', { ascending: true })
      .order('turn_index', { ascending: true })
      .limit(50000)

    if (e1) return res.status(500).json({ error: e1.message })
    if (!rows?.length) return res.status(200).json({ inserted: 0, skipped: 0, message: 'No chat messages found' })

    // 3. Pull completed session sids from site_events
    const { data: completedEvents } = await sb
      .from('site_events')
      .select('meta, created_at')
      .eq('event_type', 'intake_completed')

    const completedSids = new Set(
      (completedEvents || [])
        .map((e) => e.meta?.sid)
        .filter(Boolean)
    )

    // 4. Group messages by session_id
    const sessionMap = new Map()
    for (const row of rows) {
      if (!sessionMap.has(row.session_id)) {
        sessionMap.set(row.session_id, {
          session_id: row.session_id,
          first_created_at: row.created_at,
          messages: [],
        })
      }
      sessionMap.get(row.session_id).messages.push({
        role: row.role,
        content: row.content,
      })
    }

    const OPENING = {
      role: 'assistant',
      content: "Hi there! I'm here to get your puppy's vaccination programme sorted.\n\nTo start — what's your puppy's name, and what breed are they?",
    }

    // 5. Build intake_sessions rows
    const toInsert = []
    for (const [sid, data] of sessionMap) {
      if (alreadyImported.has(sid)) continue

      const messagesWithOpening = [OPENING, ...data.messages]
      const email = extractEmail(data.messages)
      const dogName = extractDogName(data.messages)
      const isComplete = completedSids.has(sid)

      toInsert.push({
        legacy_session_id: sid,
        messages: messagesWithOpening,
        email,
        dog_name: dogName,
        status: isComplete ? 'complete' : 'in_progress',
        created_at: data.first_created_at,
        updated_at: data.first_created_at,
      })
    }

    if (!toInsert.length) {
      return res.status(200).json({ inserted: 0, skipped: sessionMap.size, message: 'All sessions already imported' })
    }

    // 6. Insert in batches of 50
    let inserted = 0
    const BATCH = 50
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH)
      const { error: eIns, count } = await sb
        .from('intake_sessions')
        .insert(batch, { count: 'exact' })

      if (eIns) {
        console.error('[backfill-intake-sessions] insert error', eIns.message)
        // Continue — partial success is fine
      } else {
        inserted += count ?? batch.length
      }
    }

    return res.status(200).json({
      inserted,
      skipped: alreadyImported.size,
      total_sessions_in_log: sessionMap.size,
    })
  } catch (e) {
    console.error('[backfill-intake-sessions]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
