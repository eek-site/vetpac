const KEY = 'vetpac_vid'

/**
 * Returns the stable visitor ID for this browser.
 * Created on first call and persisted in localStorage forever.
 */
export function getVisitorId() {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}
