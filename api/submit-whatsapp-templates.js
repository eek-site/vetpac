/**
 * Submit all VetPac WhatsApp templates to Meta for approval.
 *
 * GET  /api/submit-whatsapp-templates          — list current template statuses
 * POST /api/submit-whatsapp-templates          — submit all pending/missing templates
 * POST /api/submit-whatsapp-templates?name=x  — submit a single template by name
 *
 * Templates take 0–24 hours for Meta to review. Once APPROVED they can be sent.
 * Check status with GET after submitting.
 */

import { ALL_TEMPLATES, submitTemplate, getTemplateStatus } from './lib/whatsapp.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Simple admin key check
  const authHeader = req.headers.authorization || ''
  const adminKey   = process.env.ADMIN_KEY || ''
  if (adminKey && authHeader !== `Bearer ${adminKey}`) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  if (req.method === 'GET') {
    // Check status of all templates
    const results = await Promise.all(
      ALL_TEMPLATES.map(async (t) => {
        const status = await getTemplateStatus(t.name)
        return { name: t.name, category: t.category, ...status }
      })
    )
    return res.status(200).json({ templates: results })
  }

  if (req.method === 'POST') {
    const singleName = req.query?.name
    const templates  = singleName
      ? ALL_TEMPLATES.filter((t) => t.name === singleName)
      : ALL_TEMPLATES

    if (singleName && templates.length === 0) {
      return res.status(404).json({ error: `Template '${singleName}' not found` })
    }

    const results = []
    for (const template of templates) {
      const result = await submitTemplate(template)
      results.push({ name: template.name, ...result })
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300))
    }

    const succeeded = results.filter((r) => r.success).length
    const failed    = results.filter((r) => !r.success).length

    return res.status(200).json({
      submitted: results.length,
      succeeded,
      failed,
      results,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
