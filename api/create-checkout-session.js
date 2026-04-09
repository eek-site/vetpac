export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Stripe not configured' })

  try {
    const { items, dogName, successUrl, cancelUrl, discountCode } = req.body

    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided' })
    }

    // bossmode: single $1 test charge
    const isBossMode = discountCode?.toLowerCase() === 'bossmode'
    const lineItems = isBossMode
      ? [{ name: 'VetPac — Test charge (bossmode)', price: 1.00 }]
      : items

    // Build Stripe form-encoded body (Stripe REST API uses urlencoded, not JSON)
    const body = new URLSearchParams()
    body.append('mode', 'payment')
    body.append('success_url', successUrl)
    body.append('cancel_url', cancelUrl)
    body.append('billing_address_collection', 'auto')
    body.append('payment_intent_data[metadata][dog_name]', dogName || '')
    body.append('payment_intent_data[metadata][platform]', 'vetpac')
    body.append('metadata[dog_name]', dogName || '')

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

    return res.status(200).json({ url: data.url, sessionId: data.id })
  } catch (err) {
    console.error('Checkout session error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
