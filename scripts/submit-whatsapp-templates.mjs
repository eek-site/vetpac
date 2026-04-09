/**
 * Submit VetPac WhatsApp templates to Meta (same WABA as EEK).
 * Usage: node scripts/submit-whatsapp-templates.mjs
 * Requires .env with WHATSAPP_TOKEN, WHATSAPP_WABA_ID
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const envPath = path.join(root, '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[k] = v
  }
}

const { ALL_TEMPLATES } = await import('../api/whatsapp-templates.js')
const { submitTemplate } = await import('../api/lib/whatsapp.js')

const args = process.argv.slice(2).map((a) => a.replace(/^vetpac_/, ''))
const list = args.length
  ? ALL_TEMPLATES.filter((t) => args.some((a) => t.name.includes(a) || t.name === `vetpac_${a}`))
  : ALL_TEMPLATES

if (list.length === 0) {
  console.error('No templates matched:', args.join(', '))
  process.exit(1)
}

console.log('Submitting', list.length, 'templates to WABA', process.env.WHATSAPP_WABA_ID || '(missing)')

let ok = 0
let fail = 0
for (const t of list) {
  const r = await submitTemplate(t)
  console.log(t.name, r.success ? 'OK' : r.error)
  if (r.success) ok++
  else fail++
  await new Promise((x) => setTimeout(x, 400))
}
console.log('Done:', ok, 'succeeded,', fail, 'failed')
