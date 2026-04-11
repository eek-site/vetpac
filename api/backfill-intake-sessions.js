/**
 * This endpoint was a one-time Supabase migration utility and is no longer applicable.
 * All intake session data lives in Prisma Postgres.
 */
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  return res.status(410).json({
    error: 'Deprecated',
    message: 'This backfill was a one-time Supabase migration utility. All session data now lives in Prisma Postgres.',
  })
}
