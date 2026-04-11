/**
 * POST — returns the complete dashboard dataset for the authenticated user.
 * Returns a `dogs` array, each dog containing:
 *   - profile (breed, sex, DOB, weight, microchip, etc.)
 *   - owner (name, email, phone, address)
 *   - health (allergies, medications, conditions, reactions, activity)
 *   - lifestyle (region, environment, risk factors)
 *   - consultation (status, date)
 *   - order (vaccines ordered, delivery method, warranty, total, status)
 *   - schedule (calculated dose dates based on DOB + order date)
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

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

function calcAgeWeeks(dob, atDate) {
  return (new Date(atDate) - new Date(dob)) / (1000 * 60 * 60 * 24 * 7)
}

/**
 * Calculate the vaccination dose schedule based on:
 *  - dog's age at time of order
 *  - NZ standard puppy/adult vaccination protocols
 */
function calcDoseSchedule(dob, orderDate) {
  if (!dob || !orderDate) return []
  const ageWeeks = calcAgeWeeks(dob, orderDate)
  const start = new Date(orderDate)
  const now = new Date()

  const doses = []

  if (ageWeeks < 10) {
    // Very young puppy — full 3-dose primary course
    doses.push({ label: 'Dose 1 — Primary', date: start, desc: 'First vaccination (6–8 weeks)' })
    doses.push({ label: 'Dose 2 — Primary', date: addDays(start, 28), desc: 'Second vaccination (10–12 weeks)' })
    doses.push({ label: 'Dose 3 — Primary', date: addDays(start, 56), desc: 'Third vaccination (14–16 weeks)' })
    doses.push({ label: 'Annual booster', date: addDays(start, 56 + 365), desc: 'Due 12 months after final puppy dose' })
  } else if (ageWeeks < 16) {
    // Mid-puppy — 2-dose primary course
    doses.push({ label: 'Dose 1 — Primary', date: start, desc: 'First vaccination (10–12 weeks)' })
    doses.push({ label: 'Dose 2 — Primary', date: addDays(start, 28), desc: 'Second vaccination (14–16 weeks)' })
    doses.push({ label: 'Annual booster', date: addDays(start, 28 + 365), desc: 'Due 12 months after final puppy dose' })
  } else if (ageWeeks < 52) {
    // Young adult — 2-dose catch-up
    doses.push({ label: 'Dose 1', date: start, desc: 'First vaccination' })
    doses.push({ label: 'Dose 2', date: addDays(start, 28), desc: 'Booster — 4 weeks after first' })
    doses.push({ label: 'Annual booster', date: addDays(start, 28 + 365), desc: 'Due 12 months after last dose' })
  } else {
    // Adult — annual booster
    doses.push({ label: 'Booster dose', date: start, desc: 'Annual vaccination' })
    doses.push({ label: 'Next annual booster', date: addDays(start, 365), desc: 'Due 12 months from now' })
  }

  return doses.map((d) => {
    const dDate = new Date(d.date)
    const isPast = dDate < now
    const isUpcoming = !isPast && dDate < addDays(now, 30)
    return {
      label: d.label,
      desc: d.desc,
      date: formatDate(dDate),
      isoDate: dDate.toISOString(),
      status: isPast ? 'due' : isUpcoming ? 'upcoming' : 'scheduled',
    }
  })
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

  // ── 1. Load all intake sessions for this user ─────────────────────────────
  let sessions = []
  try {
    const { data } = await sb
      .from('intake_sessions')
      .select('*')
      .filter('owner_details->>email', 'eq', email)
      .order('created_at', { ascending: false })
    sessions = data || []
  } catch (e) {
    console.error('[dashboard-data] intake_sessions error:', e.message)
  }

  // ── 2. Load Stripe orders ─────────────────────────────────────────────────
  const stripeOrderMap = {} // keyed by stripe_session_id
  const knownDogNames = new Set(
    sessions.map((s) => (s.dog_profile?.name || s.dog_name || '').toLowerCase()).filter(Boolean)
  )

  const secret = process.env.STRIPE_SECRET_KEY
  if (secret) {
    // Primary: search by customer_email (set at session creation for new orders)
    const emailsToSearch = [email]
    try {
      for (const searchEmail of emailsToSearch) {
        const url = new URL('https://api.stripe.com/v1/checkout/sessions')
        url.searchParams.set('limit', '50')
        url.searchParams.set('status', 'complete')
        url.searchParams.set('customer_email', searchEmail)
        url.searchParams.append('expand[]', 'data.line_items')
        url.searchParams.append('expand[]', 'data.payment_intent')

        const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${secret}` } })
        const data = await r.json()
        if (r.ok) {
          for (const s of (data.data || []).filter((s) => s.payment_status === 'paid')) {
            stripeOrderMap[s.id] = s
          }
        }
      }
    } catch (e) {
      console.error('[dashboard-data] Stripe search error:', e.message)
    }

    // Secondary: cross-reference by dog name for older orders (paid with different billing email)
    if (knownDogNames.size > 0) {
      try {
        const url = new URL('https://api.stripe.com/v1/checkout/sessions')
        url.searchParams.set('limit', '100')
        url.searchParams.set('status', 'complete')
        url.searchParams.append('expand[]', 'data.line_items')
        url.searchParams.append('expand[]', 'data.payment_intent')

        const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${secret}` } })
        const data = await r.json()
        if (r.ok) {
          for (const s of (data.data || []).filter((s) => s.payment_status === 'paid')) {
            const dogName = (s.metadata?.dog_name || '').toLowerCase()
            if (dogName && knownDogNames.has(dogName) && !stripeOrderMap[s.id]) {
              stripeOrderMap[s.id] = s
            }
          }
        }
      } catch (e) {
        console.error('[dashboard-data] Stripe dog-name cross-ref error:', e.message)
      }
    }
  }

  // Helper: parse a Stripe session into order fields
  function parseStripeOrder(s) {
    const lineItems = s.line_items?.data || []
    const pi = typeof s.payment_intent === 'object' ? s.payment_intent : null
    const receiptUrl = pi?.charges?.data?.[0]?.receipt_url || null

    const vaccines = []
    let hasAssist = false, assistTotal = 0
    let hasFreight = false, freightTotal = 0
    let hasWarranty = false, warrantyTotal = 0

    for (const li of lineItems) {
      const type = classifyLineItem(li.description)
      const amount = (li.amount_total || 0) / 100
      if (type === 'vaccine') vaccines.push({ name: li.description, price: amount })
      else if (type === 'assist') { hasAssist = true; assistTotal = amount }
      else if (type === 'freight') { hasFreight = true; freightTotal = amount }
      else if (type === 'warranty') { hasWarranty = true; warrantyTotal = amount }
    }

    return {
      stripeSessionId: s.id,
      orderDate: new Date(s.created * 1000).toISOString(),
      orderDateFormatted: formatDate(new Date(s.created * 1000)),
      orderTotal: (s.amount_total / 100).toFixed(2),
      orderStatus: 'paid',
      receiptUrl,
      vaccines,
      deliveryMethod: hasAssist ? 'vetpac_assist' : 'self_administer',
      hasFreight, freightTotal,
      hasAssist, assistTotal,
      hasWarranty, warrantyTotal,
    }
  }

  // ── 3. Build per-dog records ───────────────────────────────────────────────
  const dogs = []

  for (const s of sessions) {
    const p = s.dog_profile || {}
    const h = s.health_history || {}
    const l = s.lifestyle || {}
    const o = s.owner_details || {}

    const dogName = p.name || s.dog_name || 'Unknown'

    // Age label
    let ageLabel = null
    if (p.dob) {
      const months = Math.floor((Date.now() - new Date(p.dob)) / (1000 * 60 * 60 * 24 * 30.44))
      ageLabel = months < 24 ? `${months} months old` : `${Math.floor(months / 12)} year${Math.floor(months / 12) !== 1 ? 's' : ''} old`
    }

    // Find matched Stripe order — prefer the one stored on the intake session
    let stripeOrder = null
    if (s.stripe_session_id && stripeOrderMap[s.stripe_session_id]) {
      stripeOrder = parseStripeOrder(stripeOrderMap[s.stripe_session_id])
    } else {
      // Try to match by dog name
      const match = Object.values(stripeOrderMap).find(
        (str) => (str.metadata?.dog_name || '').toLowerCase() === dogName.toLowerCase()
      )
      if (match) stripeOrder = parseStripeOrder(match)
    }

    // Merge order data: prefer Stripe line items, fall back to stored vaccine_plan
    const orderDate = stripeOrder?.orderDate || s.order_date
    const deliveryMethod = stripeOrder?.deliveryMethod || s.delivery_method || null
    // Use || so that warranty_selected=true from intake_session always wins
    // even when the Stripe line items don't surface it (e.g. bossmode test payment)
    const warrantySelected = stripeOrder?.hasWarranty || s.warranty_selected || false
    const vaccines = stripeOrder?.vaccines?.length
      ? stripeOrder.vaccines
      : (s.vaccine_plan || [])
    const orderStatus = stripeOrder?.orderStatus || s.order_status || null
    const orderTotal = stripeOrder?.orderTotal || s.order_total || null
    const receiptUrl = stripeOrder?.receiptUrl || null

    // Dose schedule
    const schedule = calcDoseSchedule(p.dob, orderDate)

    dogs.push({
      id: s.id,
      sessionToken: s.session_token,
      consultationStatus: s.status,
      consultationDate: formatDate(s.created_at),

      profile: {
        name: dogName,
        breed: p.breed || null,
        sex: p.sex || null,
        dob: p.dob || null,
        ageLabel,
        desexed: p.desexed !== 'unknown' ? p.desexed : null,
        weight_kg: p.weight_kg !== 'unknown' ? p.weight_kg : null,
        microchip_no: p.microchip_no || null,
        colour: p.colour || null,
        vaccinated_before: p.vaccinated_before || 'no',
        prior_vaccines: p.prior_vaccines || [],
      },

      owner: {
        full_name: o.full_name || null,
        email: o.email || email,
        mobile: o.mobile || null,
        address_line1: o.address_line1 || null,
        address_line2: o.address_line2 || null,
        city: o.city || null,
        postcode: o.postcode || null,
        region: o.region || l.region || null,
      },

      health: {
        activity_level: h.activity_level || null,
        currently_ill: h.currently_ill || 'no',
        illness_description: h.illness_description || null,
        known_allergies: h.known_allergies || 'no',
        allergy_description: h.allergy_description || null,
        current_medications: h.current_medications || 'no',
        medication_list: h.medication_list || null,
        health_conditions: h.health_conditions || 'no',
        condition_description: h.condition_description || null,
        prior_vaccine_reaction: h.prior_vaccine_reaction || 'no',
        reaction_description: h.reaction_description || null,
        pregnant_or_nursing: h.pregnant_or_nursing || 'no',
      },

      lifestyle: {
        region: l.region || null,
        living_environment: l.living_environment || null,
        dog_parks_boarding: l.dog_parks_boarding || 'no',
        waterway_access: l.waterway_access || 'no',
        livestock_contact: l.livestock_contact || 'no',
        other_dogs_household: l.other_dogs_household || 'no',
      },

      order: vaccines.length || orderStatus ? {
        status: orderStatus,
        date: orderDate ? formatDate(orderDate) : null,
        total: orderTotal,
        receiptUrl,
        vaccines,
        deliveryMethod,
        warrantySelected,
        hasFreight: stripeOrder?.hasFreight ?? false,
        freightTotal: stripeOrder?.freightTotal ?? 0,
        assistTotal: stripeOrder?.assistTotal ?? 0,
        warrantyTotal: stripeOrder?.warrantyTotal ?? 0,
      } : null,

      schedule,
    })
  }

  return res.status(200).json({ dogs })
}
