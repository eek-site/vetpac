import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = {}
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
}

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await sb.from('intake_sessions').select('id, session_token, email, dog_name, status, created_at, legacy_session_id')
if (error) { console.error(error.message); process.exit(1) }
console.log(JSON.stringify(data, null, 2))
