/**
 * Open the VetPac chat widget, optionally with a pre-seeded intent.
 *
 * Intents: 'warranty-claim' | 'privacy-request' | 'complaint' |
 *          'product-concern' | 'dispute' | 'reschedule'
 */
export function openChat(intent) {
  window.dispatchEvent(new CustomEvent('vetpac:open-chat', intent ? { detail: { intent } } : undefined))
}
