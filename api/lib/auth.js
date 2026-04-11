/**
 * JWT auth helpers — replaces Supabase Auth for customer dashboard sessions.
 *
 * sign(email)          → signed JWT string (1-hour expiry)
 * verify(token)        → { email } or throws
 * requireSession(req)  → { ok, email } — use in API handlers
 */
import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET env var not set')
  return new TextEncoder().encode(s)
}

export async function signDashboardToken(email) {
  const secret = getSecret()
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)
}

export async function verifyDashboardToken(token) {
  const secret = getSecret()
  const { payload } = await jwtVerify(token, secret)
  if (!payload.email) throw new Error('Invalid token payload')
  return { email: payload.email }
}

/** Use in API route handlers that require an authenticated customer session. */
export async function requireSession(req) {
  const raw = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  if (!raw) return { ok: false, status: 401, error: 'Unauthorized' }
  try {
    const { email } = await verifyDashboardToken(raw)
    return { ok: true, email }
  } catch {
    return { ok: false, status: 401, error: 'Session expired' }
  }
}
