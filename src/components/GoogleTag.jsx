import { useEffect } from 'react'

/**
 * Loads gtag.js when VITE_GOOGLE_ADS_MEASUREMENT_ID is set.
 * Prefer the Google tag ID (GT-…) when you have one; AW-… also works for Ads-only loads.
 */
export default function GoogleTag() {
  const id = import.meta.env.VITE_GOOGLE_ADS_MEASUREMENT_ID

  useEffect(() => {
    if (!id || typeof window === 'undefined') return

    const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)
    if (existing) return

    window.dataLayer = window.dataLayer || []
    function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag = gtag

    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
    document.head.appendChild(s)

    gtag('js', new Date())
    gtag('config', id)
  }, [id])

  if (!id) return null
  return null
}
