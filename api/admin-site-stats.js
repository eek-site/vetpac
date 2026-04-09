import { getServiceSupabase } from './lib/site-events-db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const adminKey = process.env.ADMIN_KEY || ''
  if (!adminKey || auth !== `Bearer ${adminKey}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const sb = getServiceSupabase()
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' })

  const { data, error } = await sb.rpc('site_event_admin_stats')
  if (error) {
    console.error('[admin-site-stats]', error.message)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ stats: data })
}
