/**
 * WhatsApp Business Cloud API — VetPac
 *
 * Ported from EEK Mechanical's WhatsApp library.
 * VetPac is NZ-only, so all customers are NZ numbers — WhatsApp is always attempted.
 *
 * Required env vars (set in Vercel + .env):
 *   WHATSAPP_TOKEN            — Permanent System User access token (Meta Business)
 *   WHATSAPP_PHONE_NUMBER_ID  — VetPac's WhatsApp Phone Number ID
 *   WHATSAPP_WABA_ID          — WhatsApp Business Account ID (for template management)
 *   WHATSAPP_VERIFY_TOKEN     — Webhook verification secret (any string you choose)
 *
 * API: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const API_BASE = 'https://graph.facebook.com/v22.0'

const token     = () => process.env.WHATSAPP_TOKEN || ''
const phoneId   = () => process.env.WHATSAPP_PHONE_NUMBER_ID || ''
const wabaId    = () => process.env.WHATSAPP_WABA_ID || ''

export function isConfigured() {
  return !!(token() && phoneId())
}

// ── Phone formatting ──────────────────────────────────────────────────────────
// WhatsApp needs E.164 without leading +

function formatPhone(phone) {
  let n = phone.replace(/[\s\-\(\)\.\+]/g, '')

  // International prefix 00xx → strip 00
  if (n.startsWith('00') && n.length >= 11) n = n.substring(2)

  // Already has country code
  if (/^[1-9]\d{6,14}$/.test(n)) return n

  // NZ local 0xx → +64
  if (n.startsWith('0') && n.length >= 9 && n.length <= 11) return '64' + n.substring(1)

  // Short NZ number without leading 0
  if (/^\d{8,9}$/.test(n)) return '64' + n

  console.warn(`[WA] Could not format phone: ${phone}`)
  return null
}

// ── Core sender ───────────────────────────────────────────────────────────────

async function post(payload) {
  if (!isConfigured()) return { success: false, error: 'WhatsApp not configured' }

  const res = await fetch(`${API_BASE}/${phoneId()}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...payload }),
  })

  const data = await res.json()

  if (res.ok && data.messages?.[0]?.id) {
    const mid = data.messages[0].id
    console.log(`[WA] ✅ Sent to ${payload.to?.replace?.(/\d(?=\d{4})/g, '*')}: ${mid}`)
    return { success: true, messageId: mid }
  }

  const err = data.error?.message || JSON.stringify(data)
  console.error(`[WA] ❌ Failed:`, err)
  return { success: false, error: err }
}

// ── Text message (within 24h window) ─────────────────────────────────────────

export async function sendText(phone, text) {
  const to = formatPhone(phone)
  if (!to) return { success: false, error: 'Invalid phone' }
  return post({ to, type: 'text', text: { preview_url: false, body: text } })
}

// ── Template message (business-initiated, outside 24h window) ────────────────

export async function sendTemplate(phone, templateName, bodyParams = [], { buttonUrlSuffix } = {}) {
  const to = formatPhone(phone)
  if (!to) return { success: false, error: 'Invalid phone' }

  const components = []
  if (bodyParams.length > 0) {
    components.push({ type: 'body', parameters: bodyParams.map(p => ({ type: 'text', text: String(p) })) })
  }
  if (buttonUrlSuffix) {
    components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: buttonUrlSuffix }] })
  }

  return post({
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      ...(components.length > 0 ? { components } : {}),
    },
  })
}

// ── CTA button message (interactive, within 24h window) ──────────────────────

export async function sendCTA(phone, body, buttonText, buttonUrl, { header, footer } = {}) {
  const to = formatPhone(phone)
  if (!to) return { success: false, error: 'Invalid phone' }

  return post({
    to,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      ...(header ? { header: { type: 'text', text: header } } : {}),
      body: { text: body },
      ...(footer ? { footer: { text: footer } } : {}),
      action: { name: 'cta_url', parameters: { display_text: buttonText, url: buttonUrl } },
    },
  })
}

// ── Template submission & management ─────────────────────────────────────────

export async function submitTemplate(template) {
  if (!token() || !wabaId()) return { success: false, error: 'Token or WABA ID missing' }

  const res = await fetch(`${API_BASE}/${wabaId()}/message_templates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: template.name,
      category: template.category,
      language: template.language,
      components: template.components,
    }),
  })

  const data = await res.json()
  if (res.ok) {
    console.log(`[WA Template] ✅ Submitted '${template.name}' (ID: ${data.id})`)
    return { success: true, id: data.id }
  }

  const err = data.error?.message || JSON.stringify(data)
  console.error(`[WA Template] ❌ '${template.name}' failed: ${err}`)
  return { success: false, error: err }
}

export async function getTemplateStatus(name) {
  if (!token() || !wabaId()) return { status: 'UNKNOWN', error: 'Not configured' }

  const res = await fetch(`${API_BASE}/${wabaId()}/message_templates?name=${name}`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
  const data = await res.json()
  if (res.ok && data.data?.[0]) {
    return { status: data.data[0].status?.toUpperCase() || 'UNKNOWN' }
  }
  return { status: 'UNKNOWN', error: 'Template not found' }
}

// ── Webhook ───────────────────────────────────────────────────────────────────

export function parseWebhook(body) {
  const messages = []
  try {
    const entry   = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value   = changes?.value
    const raw     = value?.messages || []
    for (const msg of raw) {
      const parsed = { from: msg.from, messageId: msg.id, timestamp: msg.timestamp, type: msg.type }
      if (msg.type === 'text')   parsed.text = msg.text?.body
      if (msg.type === 'button') { parsed.text = msg.button?.text; parsed.buttonPayload = msg.button?.payload }
      messages.push(parsed)
    }
  } catch (e) { console.error('[WA] Webhook parse error:', e) }
  return messages
}
