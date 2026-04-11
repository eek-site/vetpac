/**
 * Send an internal notification email to the VetPac team via MS Graph.
 * Uses the same credentials as send-contact.js.
 *
 * notifyTeam({ subject, heading, rows: [{label, value}], body, badgeText })
 */
export async function notifyTeam({ subject, heading, rows = [], body = '', badgeText = '', badgeColor = '#2d5a3d' }) {
  const tenantId    = process.env.MS_TENANT_ID
  const clientId    = process.env.MS_CLIENT_ID
  const clientSecret= process.env.MS_CLIENT_SECRET
  const contactEmail= process.env.MS_CONTACT_EMAIL   // woof@vetpac.nz (or whatever is set)

  if (!tenantId || !clientId || !clientSecret || !contactEmail) {
    console.warn('[notify-team] Email env vars not set — skipping notification')
    return { ok: false, reason: 'not_configured' }
  }

  try {
    // Get Graph access token
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

    const rowsHtml = rows.length
      ? `<table style="width:100%;border-collapse:collapse;margin-top:16px;">
           ${rows.filter(r => r.value != null && r.value !== '' && r.value !== '—').map(r => `
             <tr>
               <td style="padding:5px 0;color:#718096;font-size:13px;width:130px;vertical-align:top;">${r.label}</td>
               <td style="padding:5px 0;font-size:13px;font-weight:600;color:#1a202c;">${String(r.value).replace(/</g,'&lt;')}</td>
             </tr>`).join('')}
         </table>`
      : ''

    const bodyHtml = body
      ? `<div style="margin-top:16px;padding:12px 16px;background:#f7f9f7;border-left:3px solid #2d5a3d;font-size:13px;white-space:pre-wrap;color:#2d3748;">${body.replace(/</g,'&lt;')}</div>`
      : ''

    const badgeHtml = badgeText
      ? `<span style="background:${badgeColor};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;margin-left:10px;vertical-align:middle;">${badgeText}</span>`
      : ''

    const html = `
      <div style="font-family:sans-serif;max-width:600px;color:#2d3748;">
        <div style="background:#1a3c2e;padding:18px 24px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;color:#fff;font-size:17px;">
            VetPac ${badgeHtml ? `<span style="font-size:14px;">${heading}</span>${badgeHtml}` : heading}
          </h2>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          ${rowsHtml}
          ${bodyHtml}
        </div>
        <p style="color:#a0aec0;font-size:11px;margin-top:12px;">Automated notification · vetpac.nz/admin</p>
      </div>`

    const sendRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${contactEmail}/sendMail`,
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
            toRecipients: [{ emailAddress: { address: contactEmail } }],
          },
          saveToSentItems: false,
        }),
      }
    )

    if (!sendRes.ok) {
      const errData = await sendRes.json().catch(() => ({}))
      throw new Error(errData.error?.message || `Graph sendMail ${sendRes.status}`)
    }

    return { ok: true }
  } catch (err) {
    console.error('[notify-team]', err.message)
    return { ok: false, error: err.message }
  }
}
