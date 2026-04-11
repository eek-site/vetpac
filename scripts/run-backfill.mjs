/**
 * Local backfill runner — same logic as api/backfill-intake-sessions.js
 * Run with: node scripts/run-backfill.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = {}
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
}

const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1) }

const sb = createClient(url, key, { auth: { persistSession: false } })

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/

function extractEmail(messages) {
  for (const m of messages) {
    if (m.role !== 'user') continue
    const match = m.content.match(EMAIL_RE)
    if (match) return match[0].toLowerCase()
  }
  return null
}

function extractDogName(messages) {
  for (const m of messages) {
    if (m.role !== 'user') continue
    const text = m.content.trim()
    if (text.length < 100) {
      const words = text.split(/\s+/)
      return words.slice(0, 2).join(' ')
    }
    break
  }
  return null
}

const { data: existing } = await sb.from('intake_sessions').select('legacy_session_id').not('legacy_session_id', 'is', null)
const alreadyImported = new Set((existing || []).map(r => r.legacy_session_id))
console.log(`Already imported: ${alreadyImported.size} sessions`)

const { data: rows, error: e1 } = await sb
  .from('intake_chat_messages')
  .select('session_id, turn_index, role, content, created_at')
  .order('session_id', { ascending: true })
  .order('turn_index', { ascending: true })
  .limit(50000)

if (e1) { console.error('Failed to read chat messages:', e1.message); process.exit(1) }
console.log(`Read ${rows?.length ?? 0} chat message rows`)

const { data: completedEvents } = await sb
  .from('site_events')
  .select('meta, created_at')
  .eq('event_type', 'intake_completed')
const completedSids = new Set((completedEvents || []).map(e => e.meta?.sid).filter(Boolean))
console.log(`Completed events: ${completedSids.size}`)

const sessionMap = new Map()
for (const row of (rows || [])) {
  if (!sessionMap.has(row.session_id)) {
    sessionMap.set(row.session_id, { session_id: row.session_id, first_created_at: row.created_at, messages: [] })
  }
  sessionMap.get(row.session_id).messages.push({ role: row.role, content: row.content })
}

const OPENING = {
  role: 'assistant',
  content: "Hi there! I'm here to get your puppy's vaccination programme sorted.\n\nTo start — what's your puppy's name, and what breed are they?",
}

const toInsert = []
for (const [sid, data] of sessionMap) {
  if (alreadyImported.has(sid)) { console.log(`  skip ${sid} (already imported)`); continue }
  const email = extractEmail(data.messages)
  const dogName = extractDogName(data.messages)
  const isComplete = completedSids.has(sid)
  toInsert.push({
    legacy_session_id: sid,
    messages: [OPENING, ...data.messages],
    email,
    dog_name: dogName,
    status: isComplete ? 'complete' : 'in_progress',
    created_at: data.first_created_at,
    updated_at: data.first_created_at,
  })
}

console.log(`Sessions to insert: ${toInsert.length} (skipping ${alreadyImported.size} already imported)`)
if (!toInsert.length) { console.log('Nothing to do.'); process.exit(0) }

let inserted = 0
const BATCH = 50
for (let i = 0; i < toInsert.length; i += BATCH) {
  const batch = toInsert.slice(i, i + BATCH)
  const { error: eIns, count } = await sb.from('intake_sessions').insert(batch, { count: 'exact' })
  if (eIns) { console.error('Insert error:', eIns.message) }
  else { inserted += count ?? batch.length; console.log(`  inserted ${inserted} so far`) }
}

console.log(`\nDone. Inserted: ${inserted}, Skipped: ${alreadyImported.size}, Total sessions in log: ${sessionMap.size}`)
