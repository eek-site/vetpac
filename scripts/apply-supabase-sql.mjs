/**
 * Apply supabase/APPLY_ALL.sql using Postgres direct connection.
 * Set DATABASE_URL to the connection string from Supabase → Settings → Database → URI (direct, not pooler).
 * Example: postgresql://postgres.[ref]:[PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
 *
 *   set DATABASE_URL=...   (PowerShell: $env:DATABASE_URL="...")
 *   node scripts/apply-supabase-sql.mjs
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg
const url = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL

if (!url) {
  console.error('Set DATABASE_URL to your Supabase Postgres connection string (Database settings in Supabase).')
  process.exit(1)
}

const sqlPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'APPLY_ALL.sql')
const sql = readFileSync(sqlPath, 'utf8')

const client = new Client({
  connectionString: url,
  ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
})

await client.connect()
try {
  await client.query(sql)
  console.log('Applied supabase/APPLY_ALL.sql successfully.')
} catch (e) {
  console.error(e.message)
  process.exit(1)
} finally {
  await client.end()
}
