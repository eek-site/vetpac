/**
 * GET /api/auth-callback?token=OTP
 * Exchanges a one-time KV token for a signed JWT session token.
 * Returns { ok: true, token: JWT, email } on success.
 */
import { kv } from '@vercel/kv'
import { handleCors } from './lib/cors.js'
import { signDashboardToken } from './lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const otp = req.query.token
  if (!otp || typeof otp !== 'string') {
    return res.status(400).json({ error: 'token required' })
  }

  const key = `magic:${otp}`
  const email = await kv.getdel(key)

  if (!email) {
    return res.status(401).json({ error: 'Link expired or already used' })
  }

  const jwt = await signDashboardToken(email)
  return res.status(200).json({ ok: true, token: jwt, email })
}
