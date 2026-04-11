/**
 * POST — returns puppy profiles for the authenticated user, sourced from intake_sessions.
 */
import { handleCors } from './lib/cors.js'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' })

  const sb = adminSupabase()
  if (!sb) return res.status(500).json({ error: 'Not configured' })

  let email
  try {
    const { data: { user }, error } = await sb.auth.getUser(token)
    if (error || !user?.email) {
      return res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' })
    }
    email = user.email.toLowerCase()
  } catch (e) {
    return res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' })
  }

  try {
    const { data: sessions, error } = await sb
      .from('intake_sessions')
      .select('id, session_token, dog_name, dog_profile, health_history, lifestyle, ai_assessment, status, created_at')
      .filter('owner_details->>email', 'eq', email)
      .in('status', ['complete', 'paid', 'in_progress'])
      .order('created_at', { ascending: false })

    if (error) throw error

    const puppies = (sessions || [])
      .filter((s) => s.dog_profile && Object.keys(s.dog_profile).length > 0)
      .map((s) => {
        const p = s.dog_profile || {}
        const h = s.health_history || {}
        const l = s.lifestyle || {}
        return {
          id: s.id,
          name: p.name || s.dog_name || 'Unknown',
          breed: p.breed || null,
          dob: p.dob || null,
          sex: p.sex || null,
          desexed: p.desexed || null,
          weight_kg: p.weight_kg || null,
          microchip_no: p.microchip_no || null,
          colour: p.colour || null,
          vaccinated_before: p.vaccinated_before || 'no',
          prior_vaccines: p.prior_vaccines || [],
          health: {
            currently_ill: h.currently_ill,
            known_allergies: h.known_allergies,
            current_medications: h.current_medications,
            health_conditions: h.health_conditions,
            activity_level: h.activity_level,
          },
          lifestyle: {
            region: l.region,
            living_environment: l.living_environment,
            dog_parks_boarding: l.dog_parks_boarding,
            waterway_access: l.waterway_access,
            livestock_contact: l.livestock_contact,
          },
          status: s.status,
          created_at: s.created_at,
        }
      })

    return res.status(200).json({ puppies })
  } catch (e) {
    console.error('[dashboard-puppies]', e)
    return res.status(500).json({ error: e.message || 'Could not load puppies' })
  }
}
