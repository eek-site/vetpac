// Sends a branded order confirmation email to the customer + internal copy to woof@vetpac.nz
// Uses MS Graph API (client credentials) — same pattern as send-contact.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    customerEmail,
    customerName,
    orderRef,
    puppyName,
    puppyCount,
    mode,          // 'consult' | 'vaccines'
    items,         // [{ name, price }]
    total,
    consultFee,
    vaccinesTotal,
    freightTotal,
    assistTotal,
    insuranceTotal,
    insuranceBilling,
  } = req.body

  if (!customerEmail || !orderRef) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const tenantId  = process.env.MS_TENANT_ID
  const clientId  = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET
  const fromEmail = process.env.MS_CONTACT_EMAIL   // woof@vetpac.nz

  if (!tenantId || !clientId || !clientSecret || !fromEmail) {
    return res.status(500).json({ error: 'Email service not configured' })
  }

  try {
    // ── Get MS Graph access token ─────────────────────────────────────────
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

    // ── Build email bodies ────────────────────────────────────────────────
    const isConsult = mode === 'consult'
    const subject = isConsult
      ? `Your VetPac consultation is confirmed — ${puppyName}`
      : `Your VetPac vaccine order is confirmed — ${puppyName}`

    const itemRows = (items || []).map(item =>
      `<tr>
        <td style="padding:8px 0;font-size:14px;color:#4a5568;border-bottom:1px solid #edf2f7;">${item.name}</td>
        <td style="padding:8px 0;font-size:14px;color:#1a202c;font-weight:600;text-align:right;border-bottom:1px solid #edf2f7;font-family:monospace;">NZD $${Number(item.price).toFixed(2)}</td>
      </tr>`
    ).join('')

    const summaryRows = [
      !isConsult && vaccinesTotal > 0 && ['Vaccines', vaccinesTotal],
      !isConsult && freightTotal > 0  && ['Cold-chain freight', freightTotal],
      !isConsult && assistTotal > 0   && ['VetPac Assist', assistTotal],
      isConsult  && consultFee > 0    && ['Consultation', consultFee],
      insuranceTotal > 0              && [`VetPac Cover (${insuranceBilling || 'annual'})`, insuranceTotal],
    ].filter(Boolean)

    const summaryHtml = summaryRows.map(([label, val]) =>
      `<tr>
        <td style="padding:6px 0;font-size:13px;color:#718096;">${label}</td>
        <td style="padding:6px 0;font-size:13px;color:#1a202c;text-align:right;font-family:monospace;">NZD $${Number(val).toFixed(2)}</td>
      </tr>`
    ).join('')

    const nextSteps = isConsult
      ? [
          ['Vet review', 'A NZ-registered vet reviews your intake within 4 hours.'],
          ['Plan confirmed', 'Your personalised vaccination programme is ready to view.'],
          ['Vaccines dispatched', 'Cold-chain courier picks up your first dose within 24 hours of plan sign-off.'],
        ]
      : [
          ['Vet review', 'A NZ-registered vet authorises your plan within 4 hours.'],
          ['Vaccines dispatched', 'Cold-chain courier picks up your order within 24 hours.'],
          ['Delivered', '1–3 business days nationwide. Temperature indicator strip included.'],
          ['Administration', 'Follow the step-by-step guide. Our team is on WhatsApp 24/7.'],
        ]

    const stepsHtml = nextSteps.map(([title, desc], i) =>
      `<tr>
        <td style="width:32px;vertical-align:top;padding-top:2px;">
          <div style="width:24px;height:24px;border-radius:50%;background:${i === 0 ? '#2d5a3d' : '#e2e8f0'};color:${i === 0 ? '#fff' : '#718096'};font-size:11px;font-weight:700;text-align:center;line-height:24px;">${i + 1}</div>
        </td>
        <td style="padding:0 0 16px 10px;">
          <p style="margin:0;font-size:14px;font-weight:600;color:${i === 0 ? '#2d5a3d' : '#1a202c'};">${title}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#718096;">${desc}</p>
        </td>
      </tr>`
    ).join('')

    const customerHtml = buildEmail({
      headline: isConsult ? 'Consultation confirmed.' : 'Order confirmed.',
      subline: isConsult
        ? `We have received ${puppyName}'s health intake and your vet review is underway.`
        : `${puppyName}'s vaccines are being prepared for dispatch.`,
      orderRef,
      itemRows: itemRows || summaryHtml,
      total,
      stepsHtml,
      isConsult,
      dashboardUrl: 'https://vetpac.nz/dashboard',
    })

    const internalHtml = buildInternalEmail({
      orderRef, puppyName, puppyCount, customerEmail, customerName,
      mode, total, items, summaryRows,
    })

    // ── Send to customer ──────────────────────────────────────────────────
    await sendEmail(accessToken, fromEmail, {
      to: customerEmail,
      subject,
      html: customerHtml,
      replyTo: fromEmail,
    })

    // ── Send internal copy ────────────────────────────────────────────────
    await sendEmail(accessToken, fromEmail, {
      to: fromEmail,
      subject: `[Order] ${orderRef} — ${puppyName} (${customerName || customerEmail})`,
      html: internalHtml,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Order email error:', err)
    return res.status(500).json({ error: err.message })
  }
}

async function sendEmail(accessToken, fromEmail, { to, subject, html, replyTo }) {
  const body = {
    message: {
      subject,
      body: { contentType: 'HTML', content: html },
      toRecipients: [{ emailAddress: { address: to } }],
      ...(replyTo ? { replyTo: [{ emailAddress: { address: replyTo } }] } : {}),
    },
    saveToSentItems: true,
  }
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to send email')
  }
}

// ── Email templates ───────────────────────────────────────────────────────────

function buildEmail({ headline, subline, orderRef, itemRows, total, stepsHtml, dashboardUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VetPac</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo header -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <a href="https://vetpac.nz" style="text-decoration:none;">
            <span style="font-size:26px;font-weight:800;color:#2d5a3d;letter-spacing:-0.5px;">VetPac</span>
            <span style="display:block;font-size:11px;color:#7c9b8a;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;">Your puppy's health, at home</span>
          </a>
        </td></tr>

        <!-- Hero card -->
        <tr><td style="background:#2d5a3d;border-radius:16px 16px 0 0;padding:36px 36px 28px;text-align:center;">
          <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:28px;">✓</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">${headline}</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.5;">${subline}</p>
          <div style="display:inline-block;margin-top:20px;background:rgba(255,255,255,0.12);border-radius:8px;padding:8px 20px;">
            <span style="font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:0.5px;">ORDER REFERENCE</span>
            <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:1px;margin-top:2px;font-family:monospace;">${orderRef}</div>
          </div>
        </td></tr>

        <!-- Order details card -->
        <tr><td style="background:#ffffff;padding:28px 36px;border-left:1px solid #e8e0d4;border-right:1px solid #e8e0d4;">
          <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#2d5a3d;text-transform:uppercase;letter-spacing:1px;">Your order</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemRows}
            <tr>
              <td colspan="2" style="padding-top:12px;"></td>
            </tr>
            <tr style="border-top:2px solid #2d5a3d;">
              <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#1a202c;">Total paid</td>
              <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#2d5a3d;text-align:right;font-family:monospace;">NZD $${Number(total).toFixed(2)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- What happens next -->
        <tr><td style="background:#ffffff;padding:0 36px 28px;border-left:1px solid #e8e0d4;border-right:1px solid #e8e0d4;">
          <hr style="border:none;border-top:1px solid #edf2f7;margin:0 0 24px;">
          <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#2d5a3d;text-transform:uppercase;letter-spacing:1px;">What happens next</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${stepsHtml}
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="background:#ffffff;padding:0 36px 32px;border-left:1px solid #e8e0d4;border-right:1px solid #e8e0d4;border-radius:0 0 16px 16px;text-align:center;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#c8612a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">View my dashboard →</a>
          <p style="margin:16px 0 0;font-size:13px;color:#a0aec0;">Questions? Message us on <strong style="color:#2d5a3d;">WhatsApp</strong> — we're available 24/7.</p>
        </td></tr>

        <!-- Trust strip -->
        <tr><td style="padding:24px 0 0;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align:center;padding:0 8px;">
                <p style="margin:0;font-size:12px;color:#7c9b8a;font-weight:600;">🔬 Vet-authorised</p>
              </td>
              <td style="text-align:center;padding:0 8px;">
                <p style="margin:0;font-size:12px;color:#7c9b8a;font-weight:600;">❄️ Cold-chain certified</p>
              </td>
              <td style="text-align:center;padding:0 8px;">
                <p style="margin:0;font-size:12px;color:#7c9b8a;font-weight:600;">💬 24/7 WhatsApp</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 8px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#a0aec0;">VetPac by Forman Pacific LLC · <a href="https://vetpac.nz" style="color:#7c9b8a;">vetpac.nz</a></p>
          <p style="margin:4px 0 0;font-size:11px;color:#cbd5e0;">Administered under ACVM Act 1997. This email was sent to ${''} because you placed an order on VetPac.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildInternalEmail({ orderRef, puppyName, puppyCount, customerEmail, customerName, mode, total, items, summaryRows }) {
  const itemList = (items || []).map(i => `<li style="font-size:13px;color:#4a5568;margin-bottom:4px;">${i.name} — NZD $${Number(i.price).toFixed(2)}</li>`).join('')
  return `<div style="font-family:sans-serif;max-width:560px;color:#2d3748;">
    <div style="background:#2d5a3d;padding:16px 24px;border-radius:8px 8px 0 0;">
      <h2 style="margin:0;color:#fff;font-size:16px;">New order: ${orderRef}</h2>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:5px 0;color:#718096;font-size:13px;width:110px;">Customer</td><td style="padding:5px 0;font-size:13px;font-weight:600;">${customerName || '—'}</td></tr>
        <tr><td style="padding:5px 0;color:#718096;font-size:13px;">Email</td><td style="padding:5px 0;font-size:13px;"><a href="mailto:${customerEmail}" style="color:#2d5a3d;">${customerEmail}</a></td></tr>
        <tr><td style="padding:5px 0;color:#718096;font-size:13px;">Puppy</td><td style="padding:5px 0;font-size:13px;">${puppyName}${puppyCount > 1 ? ` (+${puppyCount - 1} more)` : ''}</td></tr>
        <tr><td style="padding:5px 0;color:#718096;font-size:13px;">Mode</td><td style="padding:5px 0;font-size:13px;text-transform:capitalize;">${mode}</td></tr>
        <tr><td style="padding:5px 0;color:#718096;font-size:13px;">Total</td><td style="padding:5px 0;font-size:13px;font-weight:700;color:#2d5a3d;">NZD $${Number(total).toFixed(2)}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#718096;text-transform:uppercase;">Items</p>
      <ul style="margin:0;padding-left:16px;">${itemList}</ul>
    </div>
  </div>`
}
