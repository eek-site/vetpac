import { useEffect } from 'react'

/**
 * Captures gclid / UTM / Google Ads click IDs from the landing URL (same idea as EEK layout).
 * Stored in sessionStorage for VisitorTracker + optional gtag.
 */
export default function GoogleAdsContext() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const gclid = params.get('gclid')
      const hasAds =
        gclid || params.get('utm_source') || params.get('gbraid') || params.get('wbraid')
      if (!hasAds) return

      let prev = {}
      try {
        const raw = sessionStorage.getItem('vetpac_ads_context')
        if (raw) prev = JSON.parse(raw)
      } catch {
        prev = {}
      }

      const merge = (key) => params.get(key) || prev[key] || null
      const data = {
        gclid: merge('gclid'),
        gbraid: merge('gbraid'),
        wbraid: merge('wbraid'),
        utm_source: merge('utm_source'),
        utm_medium: merge('utm_medium'),
        utm_campaign: merge('utm_campaign'),
        utm_term: merge('utm_term'),
        utm_content: merge('utm_content'),
        landing: prev.landing || window.location.pathname,
        ts: new Date().toISOString(),
      }
      sessionStorage.setItem('vetpac_ads_context', JSON.stringify(data))
    } catch {
      /* ignore */
    }
  }, [])

  return null
}
