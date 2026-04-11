/**
 * POST — authenticated endpoint allowing a customer to update their own intake session.
 */
import { handleCors } from './lib/cors.js'
import { prisma } from './lib/prisma.js'
import { requireSession } from './lib/auth.js'

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

  const auth = await requireSession(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })
  const userEmail = auth.email

  const { sessionToken, dogProfile, ownerDetails, healthHistory, lifestyle } = req.body || {}
  if (!sessionToken) return res.status(400).json({ error: 'sessionToken required' })

  // Fetch the session — confirm it belongs to this user
  const existing = await prisma.intakeSession.findFirst({
    where: {
      sessionToken,
      OR: [
        { email: userEmail },
        { ownerDetails: { path: ['email'], equals: userEmail } },
      ],
    },
    select: { id: true, dogProfile: true, ownerDetails: true, healthHistory: true, lifestyle: true },
  })

  if (!existing) return res.status(403).json({ error: 'Session not found or access denied' })

  const update = {}
  if (dogProfile) {
    const safe = pick(dogProfile, ALLOWED.dog_profile)
    if (Object.keys(safe).length) update.dogProfile = { ...(existing.dogProfile || {}), ...safe }
  }
  if (ownerDetails) {
    const safe = pick(ownerDetails, ALLOWED.owner_details)
    if (Object.keys(safe).length) update.ownerDetails = { ...(existing.ownerDetails || {}), ...safe }
  }
  if (healthHistory) {
    const safe = pick(healthHistory, ALLOWED.health_history)
    if (Object.keys(safe).length) update.healthHistory = { ...(existing.healthHistory || {}), ...safe }
  }
  if (lifestyle) {
    const safe = pick(lifestyle, ALLOWED.lifestyle)
    if (Object.keys(safe).length) update.lifestyle = { ...(existing.lifestyle || {}), ...safe }
  }

  if (!Object.keys(update).length) return res.status(400).json({ error: 'No valid fields to update' })

  await prisma.intakeSession.update({ where: { id: existing.id }, data: update })
  return res.status(200).json({ ok: true })
}
