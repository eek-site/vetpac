const ALLOWED_ORIGINS = [
  'https://vetpac.nz',
  'https://www.vetpac.nz',
  process.env.SITE_URL,
].filter(Boolean)

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin || ''
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    (origin.endsWith('.vercel.app') && origin.includes('vetpac'))

  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : 'https://vetpac.nz')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

/** Call at the top of every handler. Returns true if the request was handled (OPTIONS preflight). */
export function handleCors(req, res) {
  setCorsHeaders(req, res)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }
  return false
}
