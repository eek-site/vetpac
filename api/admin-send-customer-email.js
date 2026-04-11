/**
 * POST /api/admin-send-customer-email
 * Send an email from the VetPac team (woof@vetpac.nz) to a customer.
 * Requires Microsoft JWT auth.
 */
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'
import { handleCors } from './lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  const { to, toName, subject, message, sessionSummary } = req.body || {}
  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'to, subject, and message are required' })
  }

  const tenantId     = process.env.MS_TENANT_ID
  const clientId     = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET
  const fromEmail    = process.env.MS_CONTACT_EMAIL

  if (!tenantId || !clientId || !clientSecret || !fromEmail) {
    return res.status(500).json({ error: 'Email service not configured' })
  }

  try {
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    )
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token request failed')

    const contextHtml = sessionSummary
      ? `<div style="margin-top:24px;padding:12px 16px;background:#f7f9f7;border-left:3px solid #2d5a3d;font-size:12px;color:#718096;">
           <strong style="display:block;margin-bottom:4px;color:#4a5568;">Session context</strong>
           <pre style="margin:0;white-space:pre-wrap;font-family:monospace;">${sessionSummary.replace(/</g,'&lt;')}</pre>
         </div>`
      : ''

    const html = `
      <div style="font-family:sans-serif;max-width:600px;color:#2d3748;">
        <div style="background:#1a3c2e;padding:18px 24px;border-radius:8px 8px 0 0;">
          <img src="https://vetpac.nz/paw.svg" width="28" style="vertical-align:middle;margin-right:8px;filter:brightness(0)invert(1);" />
          <span style="color:#fff;font-size:17px;font-weight:700;vertical-align:middle;">VetPac</span>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 8px 8px;">
          ${toName ? `<p style="font-size:15px;margin:0 0 16px;">Hi ${toName.split(' ')[0]},</p>` : ''}
          <div style="font-size:14px;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g,'&lt;')}</div>
          ${contextHtml}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="font-size:13px;color:#718096;margin:0;">
            The VetPac team<br />
            <a href="https://vetpac.nz" style="color:#2d5a3d;">vetpac.nz</a>
          </p>
        </div>
      </div>`

    const sendRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'HTML', content: html },
            toRecipients: [{ emailAddress: { name: toName || to, address: to } }],
            replyTo:      [{ emailAddress: { address: fromEmail } }],
          },
          saveToSentItems: true,
        }),
      }
    )

    if (!sendRes.ok) {
      const err = await sendRes.json().catch(() => ({}))
      throw new Error(err.error?.message || `Graph ${sendRes.status}`)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[admin-send-customer-email]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
