import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const PROJECT_REF = 'vyqqkvzorrqnipbovnbp'
const dir = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(dir, '..', 'supabase', 'migrations', '003_intake_sessions.sql'), 'utf8')

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) { console.error('Set SUPABASE_ACCESS_TOKEN'); process.exit(1) }

console.log(`Applying migration (${sql.length} chars)...`)

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})

const text = await res.text()
if (!res.ok) {
  console.error(`HTTP ${res.status}:`, text)
  process.exit(1)
}
console.log('Done:', text.slice(0, 300))
