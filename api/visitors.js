/**
 * Records marketing landing context and notifies woof@vetpac.nz (same pattern as EEK visitor → internal email).
 * POST body: { url, path, referrer, title, ads, device, event? }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const tenantId = process.env.MS_TENANT_ID
  const clientId = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET
  const contactEmail = process.env.MS_CONTACT_EMAIL

  if (!tenantId || !clientId || !clientSecret || !contactEmail) {
    return res.status(500).json({ error: 'Email service not configured' })
  }

  const body = req.body || {}
  const {
    url,
    path,
    referrer,
    title,
    ads = {},
    device = {},
    event = 'pageview',
  } = body

  try {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token failed')
    const accessToken = tokenData.access_token

    const xf = req.headers['x-forwarded-for']
    const ip = xf ? String(xf).split(',')[0].trim() : req.headers['x-real-ip'] || ''
    const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : ''
    const region = req.headers['x-vercel-ip-country-region'] || ''
    const country = req.headers['x-vercel-ip-country'] || ''

    const locationStr = [city, region, country].filter(Boolean).join(', ') || '—'

    const rows = [
      ['Event', event],
      ['Path', path || '—'],
      ['URL', url || '—'],
      ['Title', title || '—'],
      ['Referrer', referrer || 'Direct / none'],
      ['IP (edge)', ip || '—'],
      ['Location (Vercel)', locationStr],
      ['gclid', ads.gclid || '—'],
      ['gbraid', ads.gbraid || '—'],
      ['wbraid', ads.wbraid || '—'],
      ['utm_source', ads.utm_source || '—'],
      ['utm_medium', ads.utm_medium || '—'],
      ['utm_campaign', ads.utm_campaign || '—'],
      ['utm_term', ads.utm_term || '—'],
      ['utm_content', ads.utm_content || '—'],
      ['Landing (first touch)', ads.landing || '—'],
      ['Ads captured at', ads.ts || '—'],
      ['UA', device.userAgent || req.headers['user-agent'] || '—'],
      ['Screen', device.screen ? `${device.screen}` : '—'],
      ['Mobile', device.isMobile != null ? String(device.isMobile) : '—'],
    ]

    const tableRows = rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap;">${k}</td><td style="padding:6px 0;font-size:13px;color:#0f172a;word-break:break-all;">${String(v).replace(/</g, '&lt;')}</td></tr>`
      )
      .join('')

    const html = `<div style="font-family:system-ui,sans-serif;max-width:640px;color:#334155;">
      <div style="background:#2d5a3d;padding:14px 18px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;color:#fff;font-size:16px;">VetPac — site visit</h2>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:18px;border-radius:0 0 8px 8px;">
        <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Internal · Google Ads / UTM context when present</p>
      </div>
    </div>`

    const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${contactEmail}/sendMail`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject: `[VetPac] Visit ${path || '/'}${ads.gclid ? ' · gclid' : ''}`,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: contactEmail } }],
        },
        saveToSentItems: true,
      }),
    })

    if (!sendRes.ok) {
      const err = await sendRes.json()
      throw new Error(err.error?.message || 'Send failed')
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[visitors]', e)
    return res.status(500).json({ error: e.message })
  }
}
