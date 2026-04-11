/**
 * Stores each intake chat turn in the database.
 */
import { prisma } from './lib/prisma.js'
import { handleCors } from './lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session_id, role, content, turn_index } = req.body || {}
  if (!session_id || typeof session_id !== 'string' || session_id.length > 200) {
    return res.status(400).json({ error: 'Invalid session_id' })
  }
  if (role !== 'user' && role !== 'assistant') {
    return res.status(400).json({ error: 'Invalid role' })
  }
  if (typeof content !== 'string' || content.length < 1) {
    return res.status(400).json({ error: 'Invalid content' })
  }
  const ti = Number(turn_index)
  if (!Number.isFinite(ti) || ti < 0 || ti > 10_000) {
    return res.status(400).json({ error: 'Invalid turn_index' })
  }

  try {
    await prisma.intakeChatMessage.create({
      data: {
        sessionId: session_id,
        role,
        content: content.slice(0, 50_000),
        turnIndex: Math.floor(ti),
      },
    })
    return res.status(200).json({ ok: true })
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(200).json({ ok: true, duplicate: true })
    }
    console.error('[log-intake-message]', e.message)
    return res.status(500).json({ error: 'Insert failed' })
  }
}
