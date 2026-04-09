/**
 * Validates Authorization: Bearer <JWT> from Microsoft Entra (same app / tenant as the VetPac admin SPA).
 * Accepts access tokens for Microsoft Graph (User.Read) or ID tokens for this app (aud = client id).
 */
import { createRemoteJWKSet, jwtVerify } from 'jose'

function audienceAllowed(aud, clientId) {
  const cid = String(clientId).toLowerCase()
  const check = (a) => {
    if (a == null) return false
    const s = String(a).replace(/\/$/, '')
    if (s.toLowerCase() === cid) return true
    if (s === 'https://graph.microsoft.com') return true
    if (s.toLowerCase() === '00000003-0000-0000-c000-000000000000') return true
    return false
  }
  if (Array.isArray(aud)) return aud.some((a) => check(a))
  return check(aud)
}

function extractTenantFromIss(iss) {
  const s = String(iss || '')
  let m = /login\.microsoftonline\.com\/([^/]+)\//i.exec(s)
  if (m) return m[1].toLowerCase()
  m = /sts\.windows\.net\/([^/]+)\//i.exec(s)
  if (m) return m[1].toLowerCase()
  return null
}

function tenantMatches(payload, expectedTid) {
  const want = String(expectedTid).toLowerCase()
  if (payload.tid != null && String(payload.tid).toLowerCase() === want) return true
  const fromIss = extractTenantFromIss(payload.iss)
  return fromIss === want
}

export async function requireMicrosoftJwt(req) {
  const raw = req.headers.authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(raw)
  if (!m) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  const token = m[1]
  const tenantId = (process.env.MSAL_TENANT_ID || '61ffc6bc-d9ce-458b-8120-d32187c3770d').trim()
  const clientId = (process.env.MSAL_CLIENT_ID || 'd67be044-6aaa-4d01-ada2-da0cc50d2034').trim()

  const jwks = createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`))

  try {
    /** Signature + exp/nbf only; Azure iss string varies (v1/v2). We validate tenant + aud below. */
    const { payload } = await jwtVerify(token, jwks, {
      clockTolerance: '120s',
    })
    const iss = String(payload.iss || '')
    if (!iss.includes('login.microsoftonline.com') && !iss.includes('sts.windows.net')) {
      return { ok: false, status: 401, error: 'Unauthorized' }
    }
    if (!tenantMatches(payload, tenantId)) {
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
