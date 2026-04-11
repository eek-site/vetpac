// All Anthropic API calls are proxied through serverless API routes.
// The API key lives in process.env.ANTHROPIC_API_KEY (server-side only).

export async function runIntakeChat(messages) {
  const response = await fetch('/api/ai-intake-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!response.ok) throw new Error('AI unavailable — please try again')
  const data = await response.json()
  return data.text
}

export function parseIntakeComplete(text) {
  const marker = 'INTAKE_COMPLETE:'
  const idx = text.indexOf(marker)
  if (idx === -1) return null
  try {
    const jsonStr = text.slice(idx + marker.length).trim()
    const firstBrace = jsonStr.indexOf('{')
    const lastBrace = jsonStr.lastIndexOf('}')
    return JSON.parse(jsonStr.slice(firstBrace, lastBrace + 1))
  } catch {
    return null
  }
}

// ─── Contact chatbot ─────────────────────────────────────────────────────────

export async function runContactChat(messages) {
  const response = await fetch('/api/ai-contact-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!response.ok) throw new Error('AI unavailable')
  const data = await response.json()
  return data.text
}

export function parseContactSubmit(text) {
  const marker = 'CONTACT_SUBMIT:'
  const idx = text.indexOf(marker)
  if (idx === -1) return null
  try {
    const jsonStr = text.slice(idx + marker.length).trim()
    const first = jsonStr.indexOf('{')
    const last = jsonStr.lastIndexOf('}')
    return JSON.parse(jsonStr.slice(first, last + 1))
  } catch {
    return null
  }
}

// ─── Treatment plan generation ───────────────────────────────────────────────

export async function generateTreatmentPlan(intakeData) {
  try {
    const response = await fetch('/api/ai-treatment-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeData }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `AI API error ${response.status}`)
    }

    const data = await response.json()
    return data.plan
  } catch (error) {
    console.error('Treatment plan error:', error)
    return {
      eligible: true,
      flag_for_vet_review: true,
      flags: ['AI assessment unavailable — manual vet review required'],
      refer_to_in_person_vet: false,
      referral_reason: null,
      treatment_plan: null,
      video_assessment: null,
      error: error.message,
    }
  }
}
