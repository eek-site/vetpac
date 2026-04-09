/**
 * Runs a SQL file via Supabase Management API (needs SUPABASE_ACCESS_TOKEN with project access).
 * Usage: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-sql-management-api.mjs [path-from-repo-root]
 * Default path: supabase/APPLY_ALL.sql
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const PROJECT_REF = 'vyqqkvzorrqnipbovnbp'
const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN')
  process.exit(1)
}

const rel = process.argv[2] || 'supabase/APPLY_ALL.sql'
const sqlPath = join(dirname(fileURLToPath(import.meta.url)), '..', rel)
const query = readFileSync(sqlPath, 'utf8')

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
})

const text = await res.text()
if (!res.ok) {
  console.error(res.status, text)
  process.exit(1)
}
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2))
} catch {
  console.log(text)
}
console.log('OK: migration applied.')
