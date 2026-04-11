import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg
const dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(dir, '..', '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sql = readFileSync(join(dir, '..', 'supabase', 'migrations', '003_intake_sessions.sql'), 'utf8')
const ref = 'vyqqkvzorrqnipbovnbp'
const key = env.SUPABASE_SERVICE_ROLE_KEY  // try as password

// Supabase pooler hosts to try
const hosts = [
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-ap-southeast-2.pooler.supabase.com',
  'db.vyqqkvzorrqnipbovnbp.supabase.co',
]

for (const host of hosts) {
  for (const port of [6543, 5432]) {
    const connStr = `postgresql://postgres.${ref}:${key}@${host}:${port}/postgres`
    console.log(`Trying ${host}:${port} ...`)
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 })
    try {
      await client.connect()
      console.log('Connected! Applying migration...')
      await client.query(sql)
      console.log('Migration applied successfully.')
      await client.end()
      process.exit(0)
    } catch (e) {
      console.log(`  Failed: ${e.message.slice(0, 80)}`)
      try { await client.end() } catch {}
    }
  }
}
console.error('Could not connect with service role key as password.')
process.exit(1)
