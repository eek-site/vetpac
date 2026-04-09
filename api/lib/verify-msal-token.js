/**
 * Validates the browser's Microsoft access token by calling Graph /me (Microsoft accepts or rejects the token).
 * Then ensures tenant + app match VetPac (stats APIs never call Graph themselves — this is auth-only).
 */
import { decodeJwt } from 'jose'

const GRAPH_ME = 'https://graph.microsoft.com/v1.0/me'

export async function requireMicrosoftJwt(req) {
  const raw = req.headers.authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(raw)
  if (!m) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  const token = m[1].trim()
  if (!token) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const tenantId = (process.env.MSAL_TENANT_ID || '61ffc6bc-d9ce-458b-8120-d32187c3770d').trim()
  const clientId = (process.env.MSAL_CLIENT_ID || 'd67be044-6aaa-4d01-ada2-da0cc50d2034').trim()
  const wantTid = tenantId.toLowerCase()
  const wantCid = clientId.toLowerCase()

  let graphRes
  try {
    graphRes = await fetch(GRAPH_ME, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (e) {
    console.error('[requireMicrosoftJwt] Graph fetch', e.message)
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  if (!graphRes.ok) {
    console.error('[requireMicrosoftJwt] Graph /me', graphRes.status)
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  let payload
  try {
    payload = decodeJwt(token)
  } catch (e) {
    console.error('[requireMicrosoftJwt] decodeJwt', e.message)
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const tid = payload.tid != null ? String(payload.tid).toLowerCase() : ''
  if (tid && tid !== wantTid) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  const azp = String(payload.azp || '').toLowerCase()
  const appid = String(payload.appid || '').toLowerCase()
  const clientMatches = (azp && azp === wantCid) || (appid && appid === wantCid)
  if (!clientMatches) {
    console.error('[requireMicrosoftJwt] azp/appid mismatch')
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  return { ok: true, payload }
}
