import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

const VISITOR_ID_KEY    = 'vetpac_visitor_id'
const VISITOR_EXPIRY_KEY = 'vetpac_visitor_expiry'
const VISITOR_SESSION_KEY = 'vetpac_visitor_session'
const VISITOR_HISTORY_KEY = 'vetpac_visitor_history'

function getDeviceInfo() {
  const ua = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const nav = navigator
  return {
    userAgent: ua,
    platform: navigator.platform || 'unknown',
    language: navigator.language || 'en',
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isMobile,
    connectionType: nav.connection?.effectiveType,
    deviceMemory: nav.deviceMemory,
  }
}

function generateSessionId() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
}

function getStoredVisitorId() {
  try {
    const id = localStorage.getItem(VISITOR_ID_KEY)
    const expiry = localStorage.getItem(VISITOR_EXPIRY_KEY)
    if (!id || !expiry) return null
    if (new Date(expiry).getTime() < Date.now()) {
      localStorage.removeItem(VISITOR_ID_KEY)
      localStorage.removeItem(VISITOR_EXPIRY_KEY)
      return null
    }
    return id
  } catch { return null }
}

function storeVisitorId(id) {
  try {
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    localStorage.setItem(VISITOR_ID_KEY, id)
    localStorage.setItem(VISITOR_EXPIRY_KEY, expiry)
  } catch { /* localStorage unavailable */ }
}

function getSessionData() {
  try {
    const stored = sessionStorage.getItem(VISITOR_SESSION_KEY)
    if (stored) {
      const session = JSON.parse(stored)
      session.lastActiveAt = new Date().toISOString()
      return session
    }
  } catch { /* ignore */ }
  return {
    sessionId: generateSessionId(),
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    pagesViewed: [],
    interactions: [],
    formFields: [],
    phoneClicks: 0,
    bookingClicks: 0,
    maxScrollDepth: 0,
    timeOnSite: 0,
    isEngaged: false,
    intentSignals: [],
  }
}

function saveSessionData(session) {
  try { sessionStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(session)) } catch { /* full */ }
}

function getVisitorHistory() {
  try {
    const stored = localStorage.getItem(VISITOR_HISTORY_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return {
    visitCount: 0,
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    totalTimeSpent: 0,
    pagesVisited: [],
    hasBooked: false,
    hasCalledPhone: false,
    previousSessions: [],
  }
}

function saveVisitorHistory(history) {
  try { localStorage.setItem(VISITOR_HISTORY_KEY, JSON.stringify(history)) } catch { /* full */ }
}

function readAdsContext() {
  try {
    const raw = sessionStorage.getItem('vetpac_ads_context')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export default function VisitorTracker() {
  const location = useLocation()
  const lastPathRef         = useRef(null)
  const visitorIdRef        = useRef(null)
  const scrollMaxRef        = useRef(0)
  const sessionRef          = useRef(null)
  const historyRef          = useRef(null)
  const startTimeRef        = useRef(Date.now())
  const engagementTimerRef  = useRef(null)

  useEffect(() => {
    sessionRef.current = getSessionData()
    historyRef.current = getVisitorHistory()

    if (sessionRef.current.pagesViewed.length === 0) {
      historyRef.current.visitCount++
      historyRef.current.lastVisit = new Date().toISOString()
      saveVisitorHistory(historyRef.current)
    }

    engagementTimerRef.current = setTimeout(() => {
      if (sessionRef.current && !sessionRef.current.isEngaged) {
        sessionRef.current.isEngaged = true
        sessionRef.current.intentSignals.push('time_engaged_30s')
        saveSessionData(sessionRef.current)
        sendEngagementUpdate('engaged')
      }
    }, 30000)

    return () => { if (engagementTimerRef.current) clearTimeout(engagementTimerRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendEngagementUpdate = useCallback(async (type) => {
    if (!visitorIdRef.current || !sessionRef.current) return
    try {
      await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: visitorIdRef.current,
          event: 'engagement',
          engagementType: type,
          sessionData: {
            sessionId: sessionRef.current.sessionId,
            pagesViewed: sessionRef.current.pagesViewed.length,
            phoneClicks: sessionRef.current.phoneClicks,
            bookingClicks: sessionRef.current.bookingClicks,
            maxScrollDepth: sessionRef.current.maxScrollDepth,
            isEngaged: sessionRef.current.isEngaged,
            intentSignals: sessionRef.current.intentSignals,
            formFields: sessionRef.current.formFields,
          },
          visitorHistory: historyRef.current ? {
            visitCount: historyRef.current.visitCount,
            isReturning: historyRef.current.visitCount > 1,
            totalTimeSpent: historyRef.current.totalTimeSpent,
            hasBooked: historyRef.current.hasBooked,
            hasCalledPhone: historyRef.current.hasCalledPhone,
          } : undefined,
        }),
      })
    } catch { /* silent fail */ }
  }, [])

  const trackPageView = useCallback(async (path) => {
    if (path.startsWith('/admin') || path.startsWith('/dashboard') || path.startsWith('/vet-portal')) return

    const storedId = getStoredVisitorId()

    if (sessionRef.current && !sessionRef.current.pagesViewed.includes(path)) {
      sessionRef.current.pagesViewed.push(path)
      saveSessionData(sessionRef.current)
    }
    if (historyRef.current && !historyRef.current.pagesVisited.includes(path)) {
      historyRef.current.pagesVisited.push(path)
      saveVisitorHistory(historyRef.current)
    }

    // High-intent page signals
    const highIntentPaths = ['/plan', '/checkout', '/intake']
    if (highIntentPaths.some(p => path.startsWith(p)) && sessionRef.current) {
      const signal = `page_visit_${path.replace('/', '')}`
      if (!sessionRef.current.intentSignals.includes(signal)) {
        sessionRef.current.intentSignals.push(signal)
        saveSessionData(sessionRef.current)
      }
    }

    try {
      const ads = readAdsContext()
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: storedId,
          url: window.location.href,
          referrer: document.referrer || null,
          title: document.title,
          device: getDeviceInfo(),
          ads,
          sessionData: sessionRef.current ? {
            sessionId: sessionRef.current.sessionId,
            pagesViewed: sessionRef.current.pagesViewed.length,
            isEngaged: sessionRef.current.isEngaged,
            intentSignals: sessionRef.current.intentSignals,
          } : undefined,
          visitorHistory: historyRef.current ? {
            visitCount: historyRef.current.visitCount,
            isReturning: historyRef.current.visitCount > 1,
            firstVisit: historyRef.current.firstVisit,
          } : undefined,
        }),
      })

      const data = await response.json()
      if (data.success && data.visitorId) {
        visitorIdRef.current = data.visitorId
        if (!storedId || data.isNew) storeVisitorId(data.visitorId)
      }
    } catch (err) {
      console.error('Visitor tracking error:', err)
    }
  }, [])

  const trackScroll = useCallback(async () => {
    if (!visitorIdRef.current) return
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0

    if (sessionRef.current && scrollPercent > sessionRef.current.maxScrollDepth) {
      sessionRef.current.maxScrollDepth = scrollPercent
      if (scrollPercent >= 50 && !sessionRef.current.isEngaged) {
        sessionRef.current.isEngaged = true
        sessionRef.current.intentSignals.push('scroll_engaged_50')
      }
      saveSessionData(sessionRef.current)
    }

    if (scrollPercent > scrollMaxRef.current + 10) {
      scrollMaxRef.current = scrollPercent
      try {
        await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId: visitorIdRef.current, event: 'scroll', scrollDepth: scrollPercent }),
        })
      } catch { /* silent */ }
    }
  }, [])

  // Click tracking — intake, plan, checkout, phone
  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target
      const link = target.closest('a')
      const button = target.closest('button')
      if (!sessionRef.current) return

      // Phone clicks
      if (link?.href?.startsWith('tel:')) {
        sessionRef.current.phoneClicks++
        sessionRef.current.intentSignals.push('phone_click')
        sessionRef.current.interactions.push({ type: 'phone_click', target: link.href, timestamp: new Date().toISOString() })
        saveSessionData(sessionRef.current)
        if (historyRef.current) { historyRef.current.hasCalledPhone = true; saveVisitorHistory(historyRef.current) }
        sendEngagementUpdate('phone_click')
      }

      // Booking/plan/intake intent clicks
      const intentText = (target.textContent || '').toLowerCase()
      const isIntentLink = link?.href && (
        link.href.includes('/plan') ||
        link.href.includes('/intake') ||
        link.href.includes('/checkout')
      )
      const isIntentButton = button && (
        intentText.includes('get started') ||
        intentText.includes('build your plan') ||
        intentText.includes('continue') ||
        intentText.includes('book') ||
        target.closest('[data-track="cta"]')
      )

      if (isIntentLink || isIntentButton) {
        sessionRef.current.bookingClicks++
        sessionRef.current.intentSignals.push('cta_click')
        sessionRef.current.interactions.push({
          type: 'book_click',
          target: link?.href || intentText.slice(0, 40),
          timestamp: new Date().toISOString(),
        })
        saveSessionData(sessionRef.current)
        sendEngagementUpdate('booking_click')
      }
    }

    document.addEventListener('click', handleClick, { passive: true })
    return () => document.removeEventListener('click', handleClick)
  }, [sendEngagementUpdate])

  // Form focus tracking
  useEffect(() => {
    const handleFocus = (e) => {
      const target = e.target
      if (!target.name && !target.id) return
      if (!sessionRef.current) return
      const fieldId = target.name || target.id
      if (!sessionRef.current.formFields.includes(fieldId)) {
        sessionRef.current.formFields.push(fieldId)
        sessionRef.current.interactions.push({ type: 'form_focus', target: fieldId, timestamp: new Date().toISOString() })
        if (['name', 'breed', 'phone', 'email'].some(f => fieldId.toLowerCase().includes(f))) {
          sessionRef.current.intentSignals.push(`form_field_${fieldId}`)
        }
        saveSessionData(sessionRef.current)
      }
    }
    document.addEventListener('focusin', handleFocus, { passive: true })
    return () => document.removeEventListener('focusin', handleFocus)
  }, [])

  // Route change tracking
  useEffect(() => {
    if (location.pathname !== lastPathRef.current) {
      lastPathRef.current = location.pathname
      scrollMaxRef.current = 0
      trackPageView(location.pathname)
    }
  }, [location.pathname, trackPageView])

  // Scroll tracking
  useEffect(() => {
    let scrollTimeout
    const handleScroll = () => { clearTimeout(scrollTimeout); scrollTimeout = setTimeout(trackScroll, 500) }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(scrollTimeout) }
  }, [trackScroll])

  // Page leave / time tracking
  useEffect(() => {
    const saveTimeOnPage = () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
      if (sessionRef.current) { sessionRef.current.timeOnSite = timeSpent; saveSessionData(sessionRef.current) }
      if (historyRef.current) {
        historyRef.current.totalTimeSpent += timeSpent
        if (sessionRef.current?.pagesViewed.length > 0) {
          historyRef.current.previousSessions.push({
            date: sessionRef.current.startedAt,
            pages: sessionRef.current.pagesViewed.length,
            duration: timeSpent,
          })
          if (historyRef.current.previousSessions.length > 10) {
            historyRef.current.previousSessions = historyRef.current.previousSessions.slice(-10)
          }
        }
        saveVisitorHistory(historyRef.current)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveTimeOnPage()
        if (visitorIdRef.current && sessionRef.current) {
          const data = JSON.stringify({
            visitorId: visitorIdRef.current,
            event: 'page_leave',
            sessionData: {
              sessionId: sessionRef.current.sessionId,
              pagesViewed: sessionRef.current.pagesViewed.length,
              timeOnSite: sessionRef.current.timeOnSite,
              maxScrollDepth: sessionRef.current.maxScrollDepth,
              isEngaged: sessionRef.current.isEngaged,
              intentSignals: sessionRef.current.intentSignals,
              phoneClicks: sessionRef.current.phoneClicks,
              bookingClicks: sessionRef.current.bookingClicks,
              formFields: sessionRef.current.formFields,
            },
          })
          navigator.sendBeacon('/api/visitors', data)
        }
      }
    }

    const interval = setInterval(saveTimeOnPage, 30000)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', saveTimeOnPage)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', saveTimeOnPage)
      clearInterval(interval)
    }
  }, [])

  return null
}
