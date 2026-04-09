import { getServiceSupabase } from './lib/site-events-db.js'
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  const sb = getServiceSupabase()
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' })

  const { data, error } = await sb.rpc('intake_chat_admin_stats')
  if (error) {
    console.error('[admin-intake-stats]', error.message)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ stats: data })
}
