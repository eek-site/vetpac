import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const PING_KEY = 'vetpac_visitor_ping_sent'

function getDeviceInfo() {
  if (typeof window === 'undefined') return {}
  const ua = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  return {
    userAgent: ua,
    screen: `${window.screen?.width || 0}×${window.screen?.height || 0}`,
    isMobile,
    language: navigator.language,
  }
}

function readAdsContext() {
  try {
    const raw = sessionStorage.getItem('vetpac_ads_context')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * First page load per browser tab session: POST /api/visitors → email woof@vetpac.nz (EEK-style).
 * Skips /admin. Does not fire on every SPA navigation.
 */
export default function VisitorTracker() {
  const location = useLocation()
  const sentRef = useRef(false)

  useEffect(() => {
    if (sentRef.current) return
    if (location.pathname.startsWith('/admin')) return

    try {
      if (sessionStorage.getItem(PING_KEY)) {
        sentRef.current = true
        return
      }
    } catch {
      return
    }

    sentRef.current = true
    try {
      sessionStorage.setItem(PING_KEY, '1')
    } catch {
      /* ignore */
    }

    const ads = readAdsContext()
    const payload = {
      url: window.location.href,
      path: location.pathname,
      referrer: document.referrer || '',
      title: document.title,
      ads,
      device: getDeviceInfo(),
      event: 'pageview',
    }

    fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }, [location.pathname])

  return null
}
