/**
 * VetPac WhatsApp Message Templates
 *
 * All templates use vetpac.nz URLs and VetPac brand voice.
 * Submit via POST /api/submit-whatsapp-templates (or run the script).
 *
 * Template naming convention: vetpac_{event}
 * Button URL pattern: static base + {{1}} suffix (Meta requirement)
 *
 * Body params are positional: {{1}}, {{2}}, {{3}}
 * Button suffix is always the last dynamic part of the URL (order ref, etc.)
 *
 * To check status after submission:
 *   GET https://graph.facebook.com/v22.0/{WABA_ID}/message_templates?name=vetpac_order_confirmed
 */

// ── 1. Consultation confirmed ─────────────────────────────────────────────────
// Triggered: immediately after consult payment succeeds
// Params: {{1}} = owner first name, {{2}} = puppy name
// Button: https://vetpac.nz/plan → no suffix needed (same URL for all)

export const CONSULT_CONFIRMED = {
  name: 'vetpac_consult_confirmed',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Consultation confirmed ✓',
    },
    {
      type: 'BODY',
      text: "Hi {{1}}! Your VetPac consultation for {{2}} is confirmed.\n\nA NZ-registered vet is reviewing the intake now. Your personalised vaccination plan will be ready within 4 hours — we'll message you as soon as it is.\n\nQuestions? Just reply to this message.",
      example: { body_text: [['Sarah', 'Biscuit']] },
    },
    {
      type: 'FOOTER',
      text: 'VetPac · vetpac.nz',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'View my plan',
          url: 'https://vetpac.nz/plan',
        },
      ],
    },
  ],
}

// ── 2. Vaccine order confirmed ────────────────────────────────────────────────
// Triggered: immediately after vaccine payment succeeds
// Params: {{1}} = owner first name, {{2}} = puppy name, {{3}} = order ref

export const ORDER_CONFIRMED = {
  name: 'vetpac_order_confirmed',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Order confirmed ✓',
    },
    {
      type: 'BODY',
      text: "Hi {{1}}! {{2}}'s vaccine order is confirmed (Ref: {{3}}).\n\nYour vet is authorising the plan now. Once approved, your vaccines will be packed and dispatched within 24 hours via cold-chain courier.\n\nYou'll get another message when they ship.",
      example: { body_text: [['Sarah', 'Biscuit', 'VP-A1B2C3D4']] },
    },
    {
      type: 'FOOTER',
      text: 'VetPac · vetpac.nz',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'View dashboard',
          url: 'https://vetpac.nz/dashboard',
        },
      ],
    },
  ],
}

// ── 3. Plan ready ─────────────────────────────────────────────────────────────
// Triggered: when vet signs off the plan and it's ready to view
// Params: {{1}} = owner first name, {{2}} = puppy name

export const PLAN_READY = {
  name: 'vetpac_plan_ready',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Your plan is ready',
    },
    {
      type: 'BODY',
      text: "Hi {{1}}! {{2}}'s personalised vaccination plan has been reviewed and authorised by a NZ-registered vet.\n\nLog in to confirm your vaccines and complete your order.",
      example: { body_text: [['Sarah', 'Biscuit']] },
    },
    {
      type: 'FOOTER',
      text: 'VetPac · vetpac.nz',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'View plan',
          url: 'https://vetpac.nz/plan',
        },
      ],
    },
  ],
}

// ── 4. Dose dispatched ────────────────────────────────────────────────────────
// Triggered: when a shipment leaves the warehouse
// Params: {{1}} = owner first name, {{2}} = puppy name, {{3}} = dose label (e.g. "Dose 2 — C5")

export const DOSE_DISPATCHED = {
  name: 'vetpac_dose_dispatched',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Vaccines on their way',
    },
    {
      type: 'BODY',
      text: "Hi {{1}}! {{2}}'s {{3}} has been dispatched and is on its way via cold-chain courier.\n\nExpected delivery: 1–3 business days. A temperature indicator strip is included — check it's green when the box arrives.\n\nYour step-by-step administration guide is in the box. We're on WhatsApp 24/7 if you need us.",
      example: { body_text: [['Sarah', 'Biscuit', 'Dose 1 — C5']] },
    },
    {
      type: 'FOOTER',
      text: 'VetPac · vetpac.nz',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'View dashboard',
          url: 'https://vetpac.nz/dashboard',
        },
      ],
    },
  ],
}

// ── 5. Dose reminder ──────────────────────────────────────────────────────────
// Triggered: 3 days before a scheduled dose ships
// Params: {{1}} = owner first name, {{2}} = puppy name, {{3}} = dose label

export const DOSE_REMINDER = {
  name: 'vetpac_dose_reminder',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Upcoming dose reminder',
    },
    {
      type: 'BODY',
      text: "Hi {{1}}! A quick reminder that {{2}}'s {{3}} is coming up in the next few days.\n\nMake sure someone is home to receive the delivery. The vaccines need to go into the fridge within 30 minutes of arrival.\n\nCheck your dashboard for the full schedule.",
      example: { body_text: [['Sarah', 'Biscuit', 'Dose 2 — C5']] },
    },
    {
      type: 'FOOTER',
      text: 'VetPac · vetpac.nz',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'View schedule',
          url: 'https://vetpac.nz/dashboard',
        },
      ],
    },
  ],
}

// ── 6. Welcome / support opener ───────────────────────────────────────────────
// Triggered: when a new customer first contacts VetPac via WhatsApp
// Params: {{1}} = customer name (or "there")

export const WELCOME = {
  name: 'vetpac_welcome',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Hi from VetPac',
    },
    {
      type: 'BODY',
      text: "Hi {{1}}! Thanks for reaching out to VetPac.\n\nWe're here to help with your puppy's vaccination programme — whether you have questions about the process, need help with an order, or want guidance on administering at home.\n\nJust reply with your question and we'll get back to you.",
      example: { body_text: [['there']] },
    },
    {
      type: 'FOOTER',
      text: 'VetPac · New Zealand\'s at-home puppy vaccination service',
    },
  ],
}

// ── 7. Bank / payment instructions (EEK job workflow, same WABA) ─────────────
// Params: {{1}} = payee name, {{2}} = account number, {{3}} = job reference
// Use sendPaymentInstructions() from api/lib/whatsapp.js — do not use session text outside 24h.

export const EEK_PAYMENT_INSTRUCTIONS = {
  name: 'eek_payment_instructions',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Payment details',
    },
    {
      type: 'BODY',
      text: 'Please pay {{1}}.\n\nBank account: {{2}}\nReference: {{3}}\n\nUse the reference so we can match your payment. Reply here if you need help.',
      example: { body_text: [['EEK Mechanical', '06-0313-0860749-00', 'CZF140']] },
    },
    {
      type: 'FOOTER',
      text: 'EEK Mechanical',
    },
  ],
}

// ── 8. General update ─────────────────────────────────────────────────────────
// Fallback for any other notification
// Params: {{1}} = customer name, {{2}} = message content

export const GENERAL_UPDATE = {
  name: 'vetpac_update',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'VetPac update',
    },
    {
      type: 'BODY',
      text: 'Hi {{1}},\n\n{{2}}\n\nReply to this message if you have any questions.',
      example: { body_text: [['Sarah', 'Your order is being processed.']] },
    },
    {
      type: 'FOOTER',
      text: 'VetPac · vetpac.nz',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'My dashboard',
          url: 'https://vetpac.nz/dashboard',
        },
      ],
    },
  ],
}

// ── All templates (for batch submission) ─────────────────────────────────────

export const ALL_TEMPLATES = [
  CONSULT_CONFIRMED,
  ORDER_CONFIRMED,
  PLAN_READY,
  DOSE_DISPATCHED,
  DOSE_REMINDER,
  WELCOME,
  EEK_PAYMENT_INSTRUCTIONS,
  GENERAL_UPDATE,
]
