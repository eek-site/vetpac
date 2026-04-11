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

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Stripe not configured' })

  try {
    const {
      items,
      dogName,
      customerEmail,
      successUrl,
      cancelUrl,
      discountCode,
      // Plan data for persisting to intake_sessions
      sessionToken,
      vaccinePlan,
      deliveryMethod,
      warrantySelected,
      orderTotal,
    } = req.body

    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided' })
    }

    const isBossMode = discountCode?.toLowerCase() === 'bossmode'
    const lineItems = isBossMode
      ? [{ name: 'VetPac — Test charge (bossmode)', price: 1.00 }]
      : items

    const body = new URLSearchParams()
    body.append('ui_mode', 'embedded')
    body.append('mode', 'payment')
    body.append('return_url', successUrl)
    body.append('billing_address_collection', 'auto')
    body.append('payment_intent_data[metadata][dog_name]', dogName || '')
    body.append('payment_intent_data[metadata][platform]', 'vetpac')
    body.append('metadata[dog_name]', dogName || '')

    if (customerEmail) {
      body.append('customer_email', customerEmail)
      body.append('payment_intent_data[metadata][customer_email]', customerEmail)
      body.append('metadata[customer_email]', customerEmail)
    }
    if (sessionToken) {
      body.append('metadata[session_token]', sessionToken)
    }

    lineItems.forEach((item, i) => {
      body.append(`line_items[${i}][quantity]`, '1')
      body.append(`line_items[${i}][price_data][currency]`, 'nzd')
      body.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.price * 100)))
      body.append(`line_items[${i}][price_data][product_data][name]`, item.name)
      if (item.description) {
        body.append(`line_items[${i}][price_data][product_data][description]`, item.description)
      }
    })

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Stripe error:', data)
      return res.status(500).json({ error: data.error?.message || 'Stripe request failed' })
    }

    // Persist plan data to intake_sessions immediately — before payment completes
    if (sessionToken && (vaccinePlan || deliveryMethod != null)) {
      try {
        const sb = adminSupabase()
        if (sb) {
          await sb.from('intake_sessions').update({
            vaccine_plan: vaccinePlan || null,
            delivery_method: deliveryMethod || null,
            warranty_selected: warrantySelected || false,
            stripe_session_id: data.id,
            order_total: orderTotal || null,
            order_date: new Date().toISOString(),
            order_status: 'pending',
          }).eq('session_token', sessionToken)
        }
      } catch (e) {
        // Non-fatal — order can still proceed
        console.warn('[create-checkout-session] intake_sessions update failed:', e.message)
      }
    }

    return res.status(200).json({ clientSecret: data.client_secret, sessionId: data.id })
  } catch (err) {
    console.error('Checkout session error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
