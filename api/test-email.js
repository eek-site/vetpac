/**
 * GET /api/test-email?secret=... — tests MS Graph auth + sends a test email to woof@vetpac.nz
 * Used to diagnose email configuration issues. Protected by a simple secret check.
 */
import { handleCors } from './lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.WHATSAPP_VERIFY_TOKEN || req.query.secret !== process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  const tenantId     = process.env.MS_TENANT_ID
  const clientId     = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET
  const fromEmail    = process.env.MS_CONTACT_EMAIL

  const missing = ['MS_TENANT_ID','MS_CLIENT_ID','MS_CLIENT_SECRET','MS_CONTACT_EMAIL']
    .filter(k => !process.env[k])

  if (missing.length) {
    return res.status(500).json({ error: 'Missing env vars', missing })
  }

  try {
    // Step 1: Get token
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
    if (!tokenRes.ok) {
      return res.status(500).json({
        step: 'token',
        error: tokenData.error_description || tokenData.error || 'Token request failed',
        raw: tokenData,
      })
    }

    const accessToken = tokenData.access_token

    // Step 2: Send test email
    const mailRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject: '[VetPac] Email config test — ' + new Date().toISOString(),
            body: {
              contentType: 'HTML',
              content: '<p>If you can read this, MS Graph email is working correctly.</p><p>From: ' + fromEmail + '</p>',
            },
            toRecipients: [{ emailAddress: { address: fromEmail } }],
          },
          saveToSentItems: true,
        }),
      }
    )

    if (mailRes.status === 202) {
      return res.status(200).json({ ok: true, from: fromEmail, to: fromEmail })
    }

    const mailErr = await mailRes.json()
    return res.status(500).json({
      step: 'sendMail',
      status: mailRes.status,
      error: mailErr.error?.message || 'Send failed',
      code: mailErr.error?.code,
      raw: mailErr,
    })
  } catch (err) {
    return res.status(500).json({ step: 'exception', error: err.message })
  }
}
