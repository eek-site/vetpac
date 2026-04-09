/** Single public contact email for VetPac (SSOT). */
export const SITE_EMAIL = 'woof@vetpac.nz'

export function mailtoHref(subject = '') {
  const base = `mailto:${SITE_EMAIL}`
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base
}
