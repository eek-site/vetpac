import { handleCors } from './lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, phone, message, conversation } = req.body
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const tenantId = process.env.MS_TENANT_ID
  const clientId = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET
  const contactEmail = process.env.MS_CONTACT_EMAIL

  if (!tenantId || !clientId || !clientSecret || !contactEmail) {
    return res.status(500).json({ error: 'Email service not configured' })
  }

  try {
    // Get MS Graph access token via client credentials
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
    const accessToken = tokenData.access_token

    // Build the email body
    const conversationHtml = conversation
      ? `<h3 style="color:#4a5568;font-size:14px;margin-top:24px;">Full conversation</h3>
         <div style="background:#f7f7f7;border-left:3px solid #7c8c6e;padding:12px 16px;font-family:monospace;font-size:13px;white-space:pre-wrap;">${conversation.replace(/</g, '&lt;')}</div>`
      : ''

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:600px;color:#2d3748;">
        <div style="background:#7c8c6e;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;color:#fff;font-size:18px;">New VetPac enquiry</h2>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;width:80px;font-size:14px;">Name</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Email</td><td style="padding:6px 0;font-size:14px;"><a href="mailto:${email}" style="color:#7c8c6e;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">Phone</td><td style="padding:6px 0;font-size:14px;">${phone}</td></tr>` : ''}
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
          <h3 style="color:#4a5568;font-size:14px;margin:0 0 8px;">Message</h3>
          <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, '&lt;')}</p>
          ${conversationHtml}
        </div>
        <p style="color:#a0aec0;font-size:12px;margin-top:16px;">Sent via VetPac contact chatbot · vetpac.nz</p>
      </div>
    `

    // Send via MS Graph
    const sendRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${contactEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject: `VetPac enquiry from ${name}`,
            body: { contentType: 'HTML', content: htmlBody },
            toRecipients: [{ emailAddress: { address: contactEmail } }],
            replyTo: [{ emailAddress: { name, address: email } }],
          },
          saveToSentItems: true,
        }),
      }
    )

    if (!sendRes.ok) {
      const errData = await sendRes.json()
      throw new Error(errData.error?.message || 'Failed to send email')
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Contact email error:', err)
    return res.status(500).json({ error: err.message })
  }
}
