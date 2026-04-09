/**
 * Validates Authorization: Bearer <JWT> from Microsoft Entra (same app / tenant as the VetPac admin SPA).
 * Accepts access tokens for Microsoft Graph (User.Read) or ID tokens for this app (aud = client id).
 */
import { createRemoteJWKSet, jwtVerify } from 'jose'

function audienceAllowed(aud, clientId) {
  if (aud === clientId) return true
  if (aud === 'https://graph.microsoft.com') return true
  if (aud === '00000003-0000-0000-c000-000000000000') return true
  if (Array.isArray(aud)) return aud.some((a) => audienceAllowed(a, clientId))
  return false
}

export async function requireMicrosoftJwt(req) {
  const raw = req.headers.authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(raw)
  if (!m) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  const token = m[1]
  const tenantId = process.env.MSAL_TENANT_ID || '61ffc6bc-d9ce-458b-8120-d32187c3770d'
  const clientId = process.env.MSAL_CLIENT_ID || 'd67be044-6aaa-4d01-ada2-da0cc50d2034'
  const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`
  const jwks = createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`))

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      clockTolerance: '60s',
    })
    if (payload.tid !== tenantId) {
      return { ok: false, status: 403, error: 'Forbidden' }
    }
    if (!audienceAllowed(payload.aud, clientId)) {
      return { ok: false, status: 403, error: 'Forbidden' }
    }
    return { ok: true, payload }
  } catch (e) {
    console.error('[requireMicrosoftJwt]', e.message)
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
}
