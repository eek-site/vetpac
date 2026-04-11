import { handleCors } from './lib/cors.js'
import { prisma } from './lib/prisma.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Stripe not configured' })

  try {
    const {
      items, dogName, customerEmail, successUrl, cancelUrl, discountCode,
      sessionToken, vaccinePlan, deliveryMethod, warrantySelected, orderTotal,
    } = req.body

    if (!items || !items.length) return res.status(400).json({ error: 'No items provided' })

    const isBossMode = discountCode?.toLowerCase() === 'bossmode'
    const lineItems = isBossMode ? [{ name: 'VetPac — Test charge (bossmode)', price: 1.00 }] : items

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
    if (sessionToken) body.append('metadata[session_token]', sessionToken)
    body.append('metadata[warranty_selected]', warrantySelected ? 'true' : 'false')
    body.append('metadata[delivery_method]', deliveryMethod || 'self_administer')
    if (orderTotal) body.append('metadata[order_total]', String(orderTotal))

    lineItems.forEach((item, i) => {
      body.append(`line_items[${i}][quantity]`, '1')
      body.append(`line_items[${i}][price_data][currency]`, 'nzd')
      body.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.price * 100)))
      body.append(`line_items[${i}][price_data][product_data][name]`, item.name)
      if (item.description) body.append(`line_items[${i}][price_data][product_data][description]`, item.description)
    })

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Stripe request failed' })

    // Persist plan data to intake_sessions before payment completes
    if (sessionToken && (vaccinePlan || deliveryMethod != null)) {
      prisma.intakeSession.update({
        where: { sessionToken },
        data: {
          vaccinePlan: vaccinePlan || null,
          deliveryMethod: deliveryMethod || null,
          warrantySelected: warrantySelected || false,
          stripeSessionId: data.id,
          orderTotal: orderTotal ? String(orderTotal) : null,
          orderDate: new Date(),
          orderStatus: 'pending',
        },
      }).catch((e) => console.warn('[create-checkout-session] intake update failed:', e.message))
    }

    return res.status(200).json({ clientSecret: data.client_secret, sessionId: data.id })
  } catch (err) {
    console.error('Checkout session error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
