/**
 * POST — returns puppy profiles for the authenticated user.
 */
import { handleCors } from './lib/cors.js'
import { prisma } from './lib/prisma.js'
import { requireSession } from './lib/auth.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireSession(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error, code: 'SESSION_EXPIRED' })
  const email = auth.email

  try {
    const sessions = await prisma.intakeSession.findMany({
      where: {
        OR: [{ email }, { ownerDetails: { path: ['email'], equals: email } }],
        status: { in: ['complete', 'paid', 'in_progress'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, sessionToken: true, dogName: true,
        dogProfile: true, healthHistory: true, lifestyle: true,
        aiAssessment: true, status: true, createdAt: true,
      },
    })

    const puppies = sessions
      .filter((s) => s.dogProfile && Object.keys(s.dogProfile).length > 0)
      .map((s) => {
        const p = s.dogProfile || {}
        const h = s.healthHistory || {}
        const l = s.lifestyle || {}
        return {
          id: s.id,
          name: p.name || s.dogName || 'Unknown',
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
          created_at: s.createdAt,
        }
      })

    return res.status(200).json({ puppies })
  } catch (e) {
    console.error('[dashboard-puppies]', e)
    return res.status(500).json({ error: e.message || 'Could not load puppies' })
  }
}
