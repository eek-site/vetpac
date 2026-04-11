/**
 * POST { email } — if email has dashboard access, generate a one-time magic link
 * stored in Vercel KV (1-hour TTL) and email it via MS Graph.
 */
import { kv } from '@vercel/kv'
import { handleCors } from './lib/cors.js'
import { normalizeEmail, emailHasDashboardAccess } from './lib/dashboard-access.js'

const SITE_URL = process.env.SITE_URL || 'https://vetpac.nz'

async function getGraphToken() {
  const { MS_TENANT_ID: tenantId, MS_CLIENT_ID: clientId, MS_CLIENT_SECRET: clientSecret } = process.env
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Graph token failed')
  return data.access_token
}

async function sendMagicLinkEmail(toEmail, actionLink) {
  const fromEmail = process.env.MS_CONTACT_EMAIL
  const token = await getGraphToken()
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:520px;">
<tr><td style="text-align:center;padding-bottom:20px;">
<span style="font-size:24px;font-weight:800;color:#2d5a3d;">VetPac</span>
<span style="display:block;font-size:10px;color:#7c9b8a;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">Your puppy's health, at home</span>
</td></tr>
<tr><td style="background:#2d5a3d;border-radius:14px 14px 0 0;padding:28px;text-align:center;">
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Sign in to your dashboard</h1>
<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);">Tap the button below — link expires in 1 hour.</p>
</td></tr>
<tr><td style="background:#fff;padding:28px;border:1px solid #e8e0d4;border-top:none;border-radius:0 0 14px 14px;text-align:center;">
<a href="${actionLink.replace(/"/g, '&quot;')}" style="display:inline-block;background:#c8612a;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">Open dashboard</a>
<p style="margin:20px 0 0;font-size:12px;color:#a0aec0;">If you didn't request this, you can ignore this email.</p>
</td></tr>
<tr><td style="padding:20px;text-align:center;"><p style="margin:0;font-size:11px;color:#a0aec0;">VetPac · vetpac.nz</p></td></tr>
</table></td></tr></table></body></html>`

  const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: 'Your VetPac sign-in link',
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: toEmail } }],
      },
      saveToSentItems: true,
    }),
  })
  if (!sendRes.ok) {
    const err = await sendRes.json()
    throw new Error(err.error?.message || 'Failed to send email')
  }
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const email = normalizeEmail(req.body?.email)
  if (!email) return res.status(400).json({ error: 'Valid email required' })

  const allowed = await emailHasDashboardAccess(email)
  if (!allowed) return res.status(200).json({ ok: false, code: 'NOT_REGISTERED' })

  // Generate a cryptographically random one-time token
  const otp = crypto.randomUUID()
  const key = `magic:${otp}`

  // Store in KV with 1-hour TTL
  await kv.set(key, email, { ex: 3600 })

  const base = SITE_URL.replace(/\/$/, '')
  const actionLink = `${base}/auth/callback?token=${encodeURIComponent(otp)}`

  try {
    await sendMagicLinkEmail(email, actionLink)
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[request-magic-link]', e)
    return res.status(500).json({ error: e.message || 'Could not send sign-in link' })
  }
}
