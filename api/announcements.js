/**
 * GET  /api/announcements          — public, returns active announcements
 * GET  /api/announcements?all=1    — admin only, returns all
 * POST /api/announcements          — admin, create
 * PATCH /api/announcements?id=ID   — admin, update
 * DELETE /api/announcements?id=ID  — admin, delete
 */
import { prisma } from './lib/prisma.js'
import { requireMicrosoftJwt } from './lib/verify-msal-token.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Public GET — active announcements only
  if (req.method === 'GET' && !req.query.all) {
    const now = new Date()
    const announcements = await prisma.announcement.findMany({
      where: { startAt: { lte: now }, endAt: { gte: now } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true, startAt: true, endAt: true },
    })
    return res.status(200).json({ announcements })
  }

  const auth = await requireMicrosoftJwt(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  if (req.method === 'GET') {
    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } })
    return res.status(200).json({ announcements })
  }

  if (req.method === 'POST') {
    const { title, body, start_at, end_at } = req.body || {}
    if (!title || !body || !start_at || !end_at) {
      return res.status(400).json({ error: 'title, body, start_at and end_at are required' })
    }
    const announcement = await prisma.announcement.create({
      data: { title, body, startAt: new Date(start_at), endAt: new Date(end_at) },
    })
    return res.status(201).json({ announcement })
  }

  if (req.method === 'PATCH') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    const { title, body, start_at, end_at } = req.body || {}
    const data = {}
    if (title !== undefined) data.title = title
    if (body !== undefined) data.body = body
    if (start_at !== undefined) data.startAt = new Date(start_at)
    if (end_at !== undefined) data.endAt = new Date(end_at)
    const announcement = await prisma.announcement.update({ where: { id }, data })
    return res.status(200).json({ announcement })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    await prisma.announcement.delete({ where: { id } })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
