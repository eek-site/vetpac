/**
 * POST — single endpoint returning all dashboard data for the authenticated user:
 *   consultations  — intake sessions with dog profiles and health/lifestyle data
 *   vaccinations   — Stripe orders with line items broken out (vaccines, delivery, assist)
 *   warranty       — warranty purchase status per order
 */
import { handleCors } from './lib/cors.js'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function classifyLineItem(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('warranty') || n.includes('insurance')) return 'warranty'
  if (n.includes('assist') || n.includes('vaccinator')) return 'assist'
  if (n.includes('freight') || n.includes('cold-chain') || n.includes('delivery')) return 'freight'
  return 'vaccine'
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' })

  const sb = adminSupabase()
  if (!sb) return res.status(500).json({ error: 'Not configured' })

  let email
  try {
    const { data: { user }, error } = await sb.auth.getUser(token)
    if (error || !user?.email) return res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' })
    email = user.email.toLowerCase()
  } catch {
    return res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' })
  }

  // ── 1. Consultations from intake_sessions ──────────────────────────────────
  const consultations = []
  try {
    const { data: sessions } = await sb
      .from('intake_sessions')
      .select('id, session_token, dog_name, dog_profile, health_history, lifestyle, ai_assessment, owner_details, status, created_at, updated_at')
      .filter('owner_details->>email', 'eq', email)
      .order('created_at', { ascending: false })

    for (const s of sessions || []) {
      const p = s.dog_profile || {}
      const h = s.health_history || {}
      const l = s.lifestyle || {}
      const ownerName = s.owner_details?.full_name || ''

      // Calculate age from DOB
      let ageLabel = null
      if (p.dob) {
        const months = Math.floor((Date.now() - new Date(p.dob)) / (1000 * 60 * 60 * 24 * 30.44))
        ageLabel = months < 24 ? `${months} months old` : `${Math.floor(months / 12)} years old`
      }

      consultations.push({
        id: s.id,
        token: s.session_token,
        status: s.status, // in_progress | complete | paid
        date: new Date(s.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
        ownerName,
        dog: {
          name: p.name || s.dog_name || 'Unknown',
          breed: p.breed || null,
          sex: p.sex || null,
          dob: p.dob || null,
          ageLabel,
          desexed: p.desexed || null,
          weight_kg: p.weight_kg !== 'unknown' ? p.weight_kg : null,
          microchip_no: p.microchip_no || null,
          colour: p.colour || null,
          vaccinated_before: p.vaccinated_before || 'no',
        },
        health: {
          currently_ill: h.currently_ill,
          known_allergies: h.known_allergies,
          allergy_description: h.allergy_description || null,
          current_medications: h.current_medications,
          medication_list: h.medication_list || null,
          health_conditions: h.health_conditions,
          condition_description: h.condition_description || null,
          prior_vaccine_reaction: h.prior_vaccine_reaction,
          activity_level: h.activity_level,
          pregnant_or_nursing: h.pregnant_or_nursing,
        },
        lifestyle: {
          region: l.region || null,
          living_environment: l.living_environment || null,
          dog_parks_boarding: l.dog_parks_boarding,
          waterway_access: l.waterway_access,
          livestock_contact: l.livestock_contact,
          other_dogs_household: l.other_dogs_household,
        },
      })
    }
  } catch (e) {
    console.error('[dashboard-data] consultations error:', e.message)
  }

  // ── 2. Vaccine orders from Stripe ──────────────────────────────────────────
  const vaccinations = []
  const warrantyOrders = []

  const secret = process.env.STRIPE_SECRET_KEY
  if (secret) {
    try {
      const url = new URL('https://api.stripe.com/v1/checkout/sessions')
      url.searchParams.set('limit', '50')
      url.searchParams.set('status', 'complete')
      url.searchParams.set('customer_email', email)
      url.searchParams.append('expand[]', 'data.line_items')
      url.searchParams.append('expand[]', 'data.payment_intent')

      const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${secret}` } })
      const data = await r.json()

      if (r.ok) {
        for (const s of (data.data || []).filter((s) => s.payment_status === 'paid')) {
          const meta = s.metadata || {}
          const pi = typeof s.payment_intent === 'object' ? s.payment_intent : null
          const receiptUrl = pi?.charges?.data?.[0]?.receipt_url || null
          const lineItems = s.line_items?.data || []
          const dogName = meta.dog_name || meta.customer_name || ''

          const vaccines = []
          let hasAssist = false
          let hasFreight = false
          let hasWarranty = false
          let assistTotal = 0
          let warrantyTotal = 0
          let freightTotal = 0

          for (const li of lineItems) {
            const type = classifyLineItem(li.description)
            const amount = (li.amount_total || 0) / 100
            if (type === 'vaccine') vaccines.push({ name: li.description, price: amount })
            else if (type === 'assist') { hasAssist = true; assistTotal = amount }
            else if (type === 'freight') { hasFreight = true; freightTotal = amount }
            else if (type === 'warranty') { hasWarranty = true; warrantyTotal = amount }
          }

          const deliveryMethod = hasAssist ? 'vetpac_assist' : 'self_administer'

          const order = {
            id: s.id.slice(-8).toUpperCase(),
            sessionId: s.id,
            dogName,
            date: new Date(s.created * 1000).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
            total: (s.amount_total / 100).toFixed(2),
            receiptUrl,
            vaccines,
            deliveryMethod,
            hasFreight,
            freightTotal,
            hasAssist,
            assistTotal,
            hasWarranty,
            warrantyTotal,
          }

          vaccinations.push(order)
          if (hasWarranty) warrantyOrders.push(order)
        }
      }
    } catch (e) {
      console.error('[dashboard-data] Stripe error:', e.message)
    }
  }

  return res.status(200).json({ consultations, vaccinations, warrantyOrders })
}
