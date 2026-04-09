import Stripe from 'stripe'

export default async function handler(req, res) {
  // CORS headers — needed for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  })

  try {
    const { items, dogName, successUrl, cancelUrl, discountCode } = req.body

    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided' })
    }

    // bossmode: collapse everything to a single $1 test charge
    const isBossMode = discountCode?.toLowerCase() === 'bossmode'
    const line_items = isBossMode
      ? [{
          price_data: {
            currency: 'nzd',
            product_data: { name: 'VetPac — Test charge (bossmode)' },
            unit_amount: 100,
          },
          quantity: 1,
        }]
      : items.map((item) => ({
          price_data: {
            currency: 'nzd',
            product_data: {
              name: item.name,
              ...(item.description ? { description: item.description } : {}),
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity || 1,
        }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      // NZ billing defaults — Stripe auto-detects locale from browser
      billing_address_collection: 'auto',
      payment_intent_data: {
        // Tag the payment with NZ metadata for Forman Pacific LLC records
        metadata: {
          dog_name: dogName || '',
          platform: 'vetpac',
          currency_region: 'NZD-NZ',
        },
      },
      metadata: {
        dog_name: dogName || '',
        platform: 'vetpac',
      },
      // Allow NZ cards by default — no country restriction on payment methods
      // so NZ customers don't hit unnecessary friction
    })

    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('Stripe checkout session error:', error)
    return res.status(500).json({ error: error.message })
  }
}
