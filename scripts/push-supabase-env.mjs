/**
 * One-time: add SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL to Vercel Production.
 * Create a file `.supabase-service-role` in the repo root with ONE line (the service_role JWT from Supabase → Settings → API).
 * Then: node scripts/push-supabase-env.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const keyFile = join(root, '.supabase-service-role')

if (!existsSync(keyFile)) {
  console.error('Missing .supabase-service-role — create it with your Supabase service_role key (one line).')
  process.exit(1)
}

const serviceKey = readFileSync(keyFile, 'utf8').trim()
if (!serviceKey || serviceKey.length < 20) {
  console.error('Invalid key in .supabase-service-role')
  process.exit(1)
}

const supabaseUrl = 'https://vyqqkvzorrqnipbovnbp.supabase.co'

function vercel(args, stdin) {
  const r = spawnSync('npx', ['vercel', ...args], {
    cwd: root,
    input: stdin,
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  })
  if (r.stdout) process.stdout.write(r.stdout)
  if (r.stderr) process.stderr.write(r.stderr)
  return r.status ?? 1
}

console.log('Removing old vars (ignore errors if missing)…')
spawnSync('npx', ['vercel', 'env', 'rm', 'SUPABASE_SERVICE_ROLE_KEY', 'production', '--yes'], {
  cwd: root,
  shell: process.platform === 'win32',
  stdio: 'inherit',
})
spawnSync('npx', ['vercel', 'env', 'rm', 'SUPABASE_URL', 'production', '--yes'], {
  cwd: root,
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

console.log('Adding SUPABASE_SERVICE_ROLE_KEY…')
let code = vercel(['env', 'add', 'SUPABASE_SERVICE_ROLE_KEY', 'production'], serviceKey + '\n')
if (code !== 0) {
  console.error('Failed to add SUPABASE_SERVICE_ROLE_KEY')
  process.exit(code)
}

console.log('Adding SUPABASE_URL…')
code = vercel(['env', 'add', 'SUPABASE_URL', 'production'], supabaseUrl + '\n')
if (code !== 0) {
  console.error('Failed to add SUPABASE_URL')
  process.exit(code)
}

console.log('Done. Redeploy production: npx vercel deploy --prod --yes')
