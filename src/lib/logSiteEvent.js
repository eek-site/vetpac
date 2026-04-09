const TYPES = new Set([
  'intake_page_view',
  'intake_user_message',
  'intake_completed',
  'contact_ai_message',
  'treatment_plan_generated',
])

function sessionId() {
  try {
    let id = sessionStorage.getItem('vetpac_anon_sid')
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
      sessionStorage.setItem('vetpac_anon_sid', id)
    }
    return id
  } catch {
    return null
  }
}

export function logSiteEvent(eventType, meta = {}) {
  if (!TYPES.has(eventType)) return
  const sid = sessionId()
  const payload = { event_type: eventType, meta: { ...meta, sid } }
  fetch('/api/log-site-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}
