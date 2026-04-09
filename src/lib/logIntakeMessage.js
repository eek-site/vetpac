import { getAnalyticsSessionId } from './logSiteEvent'

const MAX = 48_000

function stripIntakeMarker(text) {
  return String(text).replace(/INTAKE_COMPLETE:\{[\s\S]*\}/, '\n[INTAKE_COMPLETE_REDACTED]').trim().slice(0, MAX)
}

/**
 * Persists each intake chat turn to Supabase via API (requires SUPABASE_SERVICE_ROLE_KEY on Vercel).
 */
export function logIntakeTurn({ role, content, turnIndex }) {
  const session_id = getAnalyticsSessionId()
  if (!session_id || !content) return

  const body = {
    session_id,
    role: role === 'user' ? 'user' : 'assistant',
    turn_index: Number(turnIndex) || 0,
    content: role === 'assistant' ? stripIntakeMarker(content) : String(content).slice(0, MAX),
  }

  fetch('/api/log-intake-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {})
}
