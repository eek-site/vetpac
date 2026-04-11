/**
 * POST { email } — find the most recent paid intake session for this email
 * and send a resume link to /plan?token=SESSION_TOKEN via MS Graph email.
 *
 * Returns:
 *   { ok: true }                          — email sent
 *   { ok: false, code: 'NOT_FOUND' }      — no session found for this email
 *   { ok: false, code: 'NOT_PAID' }       — session found but consult not paid
 */

import { prisma } from './lib/prisma.js'
import { normalizeEmail } from './lib/dashboard-access.js'
import { handleCors } from './lib/cors.js'

const SITE_URL = process.env.SITE_URL || 'https://vetpac.nz'

async function getGraphToken() {
  const tenantId = process.env.MS_TENANT_ID
  const clientId = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET
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
  if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Graph token failed')
  return tokenData.access_token
}

async function sendEmail(toEmail, subject, html) {
  const fromEmail = process.env.MS_CONTACT_EMAIL
  const graphToken = await getGraphToken()
  const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject,
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

function emailWrapper(headerBg, headline, subtext, body) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:520px;">
<tr><td style="text-align:center;padding-bottom:20px;">
<span style="font-size:24px;font-weight:800;color:#2d5a3d;">VetPac</span>
<span style="display:block;font-size:10px;color:#7c9b8a;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">Your puppy's health, at home</span>
</td></tr>
<tr><td style="background:${headerBg};border-radius:14px 14px 0 0;padding:28px;text-align:center;">
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">${headline}</h1>
<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);">${subtext}</p>
</td></tr>
<tr><td style="background:#fff;padding:28px;border:1px solid #e8e0d4;border-top:none;border-radius:0 0 14px 14px;text-align:center;">
${body}
<p style="margin:20px 0 0;font-size:12px;color:#a0aec0;">If you didn't request this, you can ignore this email.</p>
</td></tr>
<tr><td style="padding:20px;text-align:center;"><p style="margin:0;font-size:11px;color:#a0aec0;">VetPac · vetpac.nz</p></td></tr>
</table></td></tr></table></body></html>`
}

async function sendResumeEmail(toEmail, puppyName, resumeUrl) {
  const name = puppyName || 'your puppy'
  const html = emailWrapper(
    '#2d5a3d',
    `Continue ${name}'s plan`,
    'Your vaccination plan is ready and waiting. Tap below to pick up right where you left off.',
    `<a href="${resumeUrl.replace(/"/g, '&quot;')}" style="display:inline-block;background:#2d5a3d;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">Continue plan →</a>`
  )
  await sendEmail(
    toEmail,
    puppyName ? `Continue ${puppyName}'s VetPac plan` : 'Continue your VetPac plan',
    html
  )
}

async function sendStartOverEmail(toEmail, puppyName, startOverUrl) {
  const name = puppyName || 'your puppy'
  const html = emailWrapper(
    '#7c5c3a',
    `Start ${name}'s plan fresh`,
    `We found a previous session but the consultation hasn't been paid yet. You can start a new plan from scratch — it only takes a few minutes.`,
    `<a href="${startOverUrl.replace(/"/g, '&quot;')}" style="display:inline-block;background:#2d5a3d;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">Start fresh →</a>
<p style="margin:16px 0 0;font-size:13px;color:#64748b;">Your previous answers won't carry over — you'll fill in a new form for ${name}.</p>`
  )
  await sendEmail(
    toEmail,
    'Start your VetPac plan fresh',
    html
  )
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const email = normalizeEmail(req.body?.email)
  if (!email) return res.status(400).json({ error: 'Valid email required' })

  try {
    const data = await prisma.intakeSession.findFirst({
      where: {
        OR: [{ email }, { ownerDetails: { path: ['email'], equals: email } }],
      },
      orderBy: { createdAt: 'desc' },
      select: { sessionToken: true, status: true, dogProfile: true, ownerDetails: true, consultPaid: true },
    })

    if (!data) return res.status(200).json({ ok: false, code: 'NOT_FOUND' })

    const puppy_name = data.dogProfile?.name || null
    const base = SITE_URL.replace(/\/$/, '')

    const isPaid = data.consultPaid === true || data.status === 'complete' || data.status === 'review_complete'

    if (isPaid) {
      const resumeUrl = `${base}/plan?token=${encodeURIComponent(data.sessionToken)}&paid=1${puppy_name ? `&puppy=${encodeURIComponent(puppy_name)}` : ''}`
      await sendResumeEmail(email, puppy_name, resumeUrl)
      return res.status(200).json({ ok: true, paid: true })
    }

    // Not paid — send a "start fresh" link (intake form, cleared state)
    const startOverUrl = `${base}/intake?fresh=1`
    await sendStartOverEmail(email, puppy_name, startOverUrl)
    return res.status(200).json({ ok: true, paid: false })
  } catch (e) {
    console.error('[plan-resume]', e.message)
    return res.status(500).json({ error: e.message || 'Could not send resume link' })
  }
}
