import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = {}
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {}

const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
if (!url || !key) { console.error('Missing Supabase creds in .env'); process.exit(1) }

const sb = createClient(url, key, { auth: { persistSession: false } })

// 1. Verify table
const { data, error } = await sb.from('intake_sessions').select('id').limit(1)
if (error) { console.error('Table check failed:', error.message); process.exit(1) }
console.log('✓ intake_sessions table exists')

// 2. Count existing sessions
const { count } = await sb.from('intake_sessions').select('*', { count: 'exact', head: true })
console.log(`  Existing rows: ${count}`)

// 3. Count logs to backfill from
const { count: logCount } = await sb.from('intake_chat_messages').select('*', { count: 'exact', head: true })
console.log(`  intake_chat_messages rows available to backfill: ${logCount}`)
