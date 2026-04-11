/**
 * POST — authenticated endpoint allowing a customer to update their own
 * intake session data. Merges provided section updates into the stored JSONB.
 *
 * Body: {
 *   sessionToken: string,          // identifies the session to update
 *   dogProfile?:     { ... },      // partial dog_profile overrides
 *   ownerDetails?:   { ... },      // partial owner_details overrides
 *   healthHistory?:  { ... },      // partial health_history overrides
 *   lifestyle?:      { ... },      // partial lifestyle overrides
 * }
 */
import { handleCors } from './lib/cors.js'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// Fields allowed to be updated in each section (whitelist)
const ALLOWED = {
  dog_profile: ['name', 'breed', 'sex', 'dob', 'weight_kg', 'colour', 'desexed', 'microchip_no'],
  owner_details: ['full_name', 'mobile', 'address_line1', 'address_line2', 'city', 'postcode', 'region'],
  health_history: [
    'activity_level', 'currently_ill', 'illness_description',
    'known_allergies', 'allergy_description',
    'current_medications', 'medication_list',
    'health_conditions', 'condition_description',
    'prior_vaccine_reaction', 'reaction_description',
    'pregnant_or_nursing',
  ],
  lifestyle: ['region', 'living_environment', 'dog_parks_boarding', 'waterway_access', 'livestock_contact'],
}

function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return {}
  return Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]))
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const sb = adminSupabase()
  if (!sb) return res.status(500).json({ error: 'Not configured' })

  // Verify session — get the user's email
  let userEmail
  try {
    const { data: { user }, error } = await sb.auth.getUser(authHeader)
    if (error || !user?.email) return res.status(401).json({ error: 'Session expired' })
    userEmail = user.email.toLowerCase()
  } catch {
    return res.status(401).json({ error: 'Session expired' })
  }

  const { sessionToken, dogProfile, ownerDetails, healthHistory, lifestyle } = req.body || {}
  if (!sessionToken) return res.status(400).json({ error: 'sessionToken required' })

  // Fetch the session — confirm it belongs to this user
  const { data: existing, error: fetchErr } = await sb
    .from('intake_sessions')
    .select('id, dog_profile, owner_details, health_history, lifestyle')
    .eq('session_token', sessionToken)
    .filter('owner_details->>email', 'eq', userEmail)
    .maybeSingle()

  if (fetchErr || !existing) {
    return res.status(403).json({ error: 'Session not found or access denied' })
  }

  // Build the update — merge only allowed fields
  const update = {}

  if (dogProfile) {
    const safe = pick(dogProfile, ALLOWED.dog_profile)
    if (Object.keys(safe).length) {
      update.dog_profile = { ...(existing.dog_profile || {}), ...safe }
    }
  }
  if (ownerDetails) {
    const safe = pick(ownerDetails, ALLOWED.owner_details)
    if (Object.keys(safe).length) {
      update.owner_details = { ...(existing.owner_details || {}), ...safe }
    }
  }
  if (healthHistory) {
    const safe = pick(healthHistory, ALLOWED.health_history)
    if (Object.keys(safe).length) {
      update.health_history = { ...(existing.health_history || {}), ...safe }
    }
  }
  if (lifestyle) {
    const safe = pick(lifestyle, ALLOWED.lifestyle)
    if (Object.keys(safe).length) {
      update.lifestyle = { ...(existing.lifestyle || {}), ...safe }
    }
  }

  if (!Object.keys(update).length) {
    return res.status(400).json({ error: 'No valid fields to update' })
  }

  const { error: updateErr } = await sb
    .from('intake_sessions')
    .update(update)
    .eq('id', existing.id)

  if (updateErr) {
    console.error('[update-intake]', updateErr)
    return res.status(500).json({ error: updateErr.message })
  }

  return res.status(200).json({ ok: true })
}
