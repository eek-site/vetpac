const SESSION_KEY = 'vetpac_session'

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { token, email, exp } = JSON.parse(raw)
    if (!token || !email) return null
    if (exp && Date.now() > exp) { clearSession(); return null }
    return { token, email }
  } catch {
    return null
  }
}

export function setSession(token, email) {
  try {
    const exp = Date.now() + 55 * 60 * 1000 // 55 min (JWT is 1hr)
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, email, exp }))
  } catch {}
}

export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

export function getAuthHeader() {
  const s = getSession()
  return s ? `Bearer ${s.token}` : null
}
