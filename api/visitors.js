/**
 * Visitor tracking — stores sessions in Vercel KV, emails woof@vetpac.nz on new visitors.
 * Same pattern as eek.nz visitor tracking.
 *
 * Required env vars:
 *   KV_REST_API_URL, KV_REST_API_TOKEN — Vercel KV (or Upstash Redis via Vercel integration)
 *   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MS_CONTACT_EMAIL — email notification
 */

import { kv } from '@vercel/kv'

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60

function generateVisitorId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `v_${timestamp}_${random}`
}

function parseTrackingParams(url) {
  try {
    const urlObj = new URL(url)
    const p = urlObj.searchParams
    return {
      utmSource: p.get('utm_source') || undefined,
      utmMedium: p.get('utm_medium') || undefined,
      utmCampaign: p.get('utm_campaign') || undefined,
      utmTerm: p.get('utm_term') || undefined,
      utmContent: p.get('utm_content') || undefined,
      gclid: p.get('gclid') || undefined,
      gbraid: p.get('gbraid') || undefined,
      wbraid: p.get('wbraid') || undefined,
      fbclid: p.get('fbclid') || undefined,
      msclkid: p.get('msclkid') || undefined,
      adsSrc: p.get('ads_src') || undefined,
      landingPage: urlObj.pathname,
    }
  } catch {
    return { landingPage: '/' }
  }
}

function getSourceLabel(source) {
  if (source.gclid || source.gbraid || source.wbraid) return 'Google Ads'
  if (source.fbclid) return 'Facebook Ads'
  if (source.msclkid) return 'Microsoft Ads'
  if (source.utmSource) {
    const medium = source.utmMedium ? ` (${source.utmMedium})` : ''
    return `${source.utmSource}${medium}`
  }
  if (source.referrer) {
    try {
      const ref = new URL(source.referrer)
      if (ref.hostname.includes('google')) return 'Google Search'
      if (ref.hostname.includes('bing')) return 'Bing Search'
      if (ref.hostname.includes('facebook')) return 'Facebook'
      if (ref.hostname.includes('instagram')) return 'Instagram'
      return ref.hostname
    } catch { return 'Referral' }
  }
  return 'Direct'
}

function getSourceEmoji(source) {
  if (source.gclid || source.gbraid || source.wbraid) return '🔵'
  if (source.fbclid) return '📘'
  if (source.msclkid) return '🟢'
  if (source.utmSource) return '🏷️'
  if (source.referrer) {
    try {
      const ref = new URL(source.referrer)
      if (ref.hostname.includes('google')) return '🔍'
      if (ref.hostname.includes('facebook')) return '📘'
      if (ref.hostname.includes('instagram')) return '📷'
      return '🔗'
    } catch { return '🔗' }
  }
  return '🎯'
}

async function sendNewVisitorEmail({ visitor, sourceLabel, sourceEmoji }) {
  const tenantId = process.env.MS_TENANT_ID
  const clientId = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET
  const contactEmail = process.env.MS_CONTACT_EMAIL

  if (!tenantId || !clientId || !clientSecret || !contactEmail) return

  try {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) return
    const accessToken = tokenData.access_token

    const locationStr = [visitor.location?.city, visitor.location?.region, visitor.location?.country]
      .filter(Boolean).join(', ') || '—'

    const adminUrl = `https://vetpac.nz/admin?tab=visitors&observe=${visitor.id}`

    const rows = [
      ['Source', `${sourceEmoji} ${sourceLabel}`],
      ['Landing page', visitor.source.landingPage || '—'],
      ['Referrer', visitor.source.referrer || 'Direct'],
      ['Location', locationStr],
      ['Device', visitor.device.isMobile ? `📱 Mobile (${visitor.device.platform})` : `🖥 Desktop (${visitor.device.platform})`],
      ['gclid', visitor.source.gclid || '—'],
      ['utm_campaign', visitor.source.utmCampaign || '—'],
      ['Visitor ID', visitor.id],
    ]

    const tableRows = rows.map(([k, v]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;white-space:nowrap;">${k}</td><td style="padding:6px 0;font-size:13px;color:#0f172a;word-break:break-all;">${String(v).replace(/</g, '&lt;')}</td></tr>`
    ).join('')

    const html = `<div style="font-family:system-ui,sans-serif;max-width:640px;color:#334155;">
      <div style="background:#2d5a3d;padding:14px 18px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;color:#fff;font-size:16px;">VetPac — new visitor</h2>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:18px;border-radius:0 0 8px 8px;">
        <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
        <p style="margin:16px 0 0;">
          <a href="${adminUrl}" style="display:inline-block;background:#2d5a3d;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;">Observe visitor →</a>
        </p>
      </div>
    </div>`

    await fetch(`https://graph.microsoft.com/v1.0/users/${contactEmail}/sendMail`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject: `[VetPac] ${sourceEmoji} New visitor · ${visitor.source.landingPage || '/'}`,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: contactEmail } }],
        },
        saveToSentItems: true,
      }),
    })
  } catch (err) {
    console.error('[visitors] email error:', err)
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET — list visitors for admin
  if (req.method === 'GET') {
    try {
      const limit  = parseInt(req.query?.limit  || '50')
      const offset = parseInt(req.query?.offset || '0')

      const visitorIds = await kv.zrange('vetpac:visitors:list', offset, offset + limit - 1, { rev: true })
      const visitors = []
      for (const id of visitorIds) {
        const visitor = await kv.hgetall(`vetpac:visitor:${id}`)
        if (visitor) visitors.push(visitor)
      }
      const total = await kv.zcard('vetpac:visitors:list')

      return res.status(200).json({ success: true, visitors, total, limit, offset })
    } catch (err) {
      console.error('[visitors GET]', err)
      return res.status(500).json({ success: false, error: 'Failed to list visitors', visitors: [] })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = req.body || {}
    const {
      visitorId,
      url,
      referrer,
      title,
      device,
      ads = {},
      event,
      sessionData,
      visitorHistory,
    } = body

    const now = new Date().toISOString()
    let visitor = null
    let isNewVisitor = false

    if (visitorId) {
      visitor = await kv.hgetall(`vetpac:visitor:${visitorId}`)
    }

    if (!visitor) {
      isNewVisitor = true
      const newId = visitorId || generateVisitorId()
      const trackingParams = parseTrackingParams(url || 'https://vetpac.nz/')

      // Merge ads context from client (Google Ads gclid etc.)
      const mergedSource = {
        referrer: referrer || null,
        ...trackingParams,
        landingPage: trackingParams.landingPage || '/',
        gclid: ads.gclid || trackingParams.gclid,
        gbraid: ads.gbraid,
        wbraid: ads.wbraid,
        utmSource: ads.utm_source || trackingParams.utmSource,
        utmMedium: ads.utm_medium || trackingParams.utmMedium,
        utmCampaign: ads.utm_campaign || trackingParams.utmCampaign,
        utmTerm: ads.utm_term || trackingParams.utmTerm,
        utmContent: ads.utm_content || trackingParams.utmContent,
      }

      visitor = {
        id: newId,
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(Date.now() + THIRTY_DAYS_SECONDS * 1000).toISOString(),
        source: mergedSource,
        device: device || {
          userAgent: req.headers['user-agent'] || '',
          platform: 'unknown',
          language: 'en',
          screenWidth: 0,
          screenHeight: 0,
          timezone: 'Pacific/Auckland',
          isMobile: false,
        },
        pageViews: [],
        metrics: {
          totalPageViews: 0,
          uniquePages: 0,
          totalTimeOnSite: 0,
          lastActiveAt: now,
          sessionCount: 1,
          isReturning: false,
        },
      }

      // Geo from Vercel edge headers
      const xf = req.headers['x-forwarded-for']
      const ip = xf ? String(xf).split(',')[0].trim() : req.headers['x-real-ip']
      const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : undefined
      const region = req.headers['x-vercel-ip-country-region'] || undefined
      const country = req.headers['x-vercel-ip-country'] || undefined

      visitor.location = { ip: ip || undefined, city, region, country }
    } else {
      visitor.updatedAt = now
      visitor.metrics.lastActiveAt = now

      const lastActive = new Date(visitor.metrics.lastActiveAt).getTime()
      if (Date.now() - lastActive > 30 * 60 * 1000) {
        visitor.metrics.sessionCount = (visitor.metrics.sessionCount || 1) + 1
        visitor.metrics.isReturning = true
      }
    }

    // Record page view
    if (url && (!event || event === 'pageview')) {
      try {
        const urlObj = new URL(url)
        const currentPath = urlObj.pathname
        const pageViews = Array.isArray(visitor.pageViews) ? visitor.pageViews : []
        const lastView = pageViews.length > 0 ? pageViews[pageViews.length - 1] : null
        const isRefresh = lastView &&
          lastView.path === currentPath &&
          (Date.now() - new Date(lastView.timestamp).getTime()) < 5000

        if (!isRefresh) {
          if (lastView) {
            const timeOnPage = Math.round((Date.now() - new Date(lastView.timestamp).getTime()) / 1000)
            if (timeOnPage < 1800) {
              lastView.timeOnPage = timeOnPage
              visitor.metrics.totalTimeOnSite = (visitor.metrics.totalTimeOnSite || 0) + timeOnPage
            }
          }

          pageViews.push({
            url,
            path: currentPath,
            title: title || currentPath,
            timestamp: now,
            referrer: lastView ? lastView.path : (referrer || ''),
          })
          visitor.pageViews = pageViews
          visitor.metrics.totalPageViews = (visitor.metrics.totalPageViews || 0) + 1
          visitor.metrics.uniquePages = new Set(pageViews.map(p => p.path)).size
        }
      } catch { /* invalid URL */ }
    }

    // Scroll depth update
    if (event === 'scroll' && body.scrollDepth !== undefined) {
      const pageViews = Array.isArray(visitor.pageViews) ? visitor.pageViews : []
      if (pageViews.length > 0) {
        const last = pageViews[pageViews.length - 1]
        last.scrollDepth = Math.max(last.scrollDepth || 0, body.scrollDepth)
        visitor.pageViews = pageViews
      }
    }

    // Engagement + page_leave
    if (event === 'engagement' || event === 'page_leave') {
      if (sessionData) {
        visitor.currentSession = {
          sessionId: sessionData.sessionId,
          pagesViewed: sessionData.pagesViewed || 0,
          phoneClicks: sessionData.phoneClicks || 0,
          bookingClicks: sessionData.bookingClicks || 0,
          maxScrollDepth: sessionData.maxScrollDepth || 0,
          isEngaged: sessionData.isEngaged || false,
          intentSignals: sessionData.intentSignals || [],
          formFields: sessionData.formFields || [],
          timeOnSite: sessionData.timeOnSite || 0,
        }
        if (sessionData.phoneClicks > 0 || sessionData.bookingClicks > 0) {
          visitor.hasHighIntent = true
        }
        if (sessionData.isEngaged) visitor.metrics.isEngaged = true
      }
      if (visitorHistory) {
        visitor.historyMetrics = {
          totalVisits: visitorHistory.visitCount || 1,
          isReturning: visitorHistory.isReturning || visitorHistory.visitCount > 1,
          totalTimeSpent: visitorHistory.totalTimeSpent || 0,
          hasBooked: visitorHistory.hasBooked || false,
          hasCalledPhone: visitorHistory.hasCalledPhone || false,
        }
        if (visitorHistory.visitCount > 1) {
          visitor.metrics.isReturning = true
          visitor.metrics.sessionCount = visitorHistory.visitCount
        }
      }
    }

    // Persist to KV
    await kv.hset(`vetpac:visitor:${visitor.id}`, visitor)
    await kv.expire(`vetpac:visitor:${visitor.id}`, THIRTY_DAYS_SECONDS)
    await kv.zadd('vetpac:visitors:list', { score: Date.now(), member: visitor.id })

    // Email on new visitors (fire-and-forget)
    if (isNewVisitor) {
      const sourceLabel = getSourceLabel(visitor.source)
      const sourceEmoji = getSourceEmoji(visitor.source)
      sendNewVisitorEmail({ visitor, sourceLabel, sourceEmoji }).catch(() => {})
    }

    return res.status(200).json({ success: true, visitorId: visitor.id, isNew: isNewVisitor })
  } catch (err) {
    console.error('[visitors POST]', err)
    return res.status(500).json({ success: false, error: 'Tracking failed' })
  }
}
