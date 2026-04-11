import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Lock, Shield, CheckCircle, ChevronDown, ChevronUp, Tag, AlertCircle, Loader2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import Button from '../components/ui/Button'
import { useIntakeStore } from '../store/intakeStore'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function LineItemRow({ label, description, price }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <div>
        <span className="text-textSecondary font-medium">{label}</span>
        {description && <p className="text-xs text-textMuted mt-0.5">{description}</p>}
      </div>
      <span className="font-mono font-semibold text-textPrimary flex-shrink-0">
        NZD ${Number(price).toFixed(2)}
      </span>
    </div>
  )
}

export default function Checkout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { consultPaid } = useIntakeStore()
  const checkoutRef = useRef(null)
  const checkoutInstanceRef = useRef(null)

  // URL params
  const mode = params.get('mode') || 'consult'
  const isConsult = mode === 'consult'

  // If consult already paid, don't allow reaching this page again via back button
  useEffect(() => {
    if (isConsult && consultPaid) navigate('/plan', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const dogName = params.get('puppy') || 'your puppy'
  const puppyCount = parseInt(params.get('puppyCount') || '1')
  const total = parseFloat(params.get('total') || '0')
  const consultFee = parseFloat(params.get('consult') || '0')
  const vaccinesTotal = parseFloat(params.get('vaccines') || '0')
  const freightTotal = parseFloat(params.get('freight') || '0')
  const assistTotal = parseFloat(params.get('assist') || '0')
  const insuranceTotal = parseFloat(params.get('insurance') || '0')
  const insuranceBilling = params.get('insuranceBilling') || 'annual'

  let vaccineItems = []
  try { vaccineItems = JSON.parse(decodeURIComponent(params.get('items') || '[]')) } catch { /* invalid JSON — use empty */ }

  // State
  const [orderOpen, setOrderOpen] = useState(true)
  const [discountInput, setDiscountInput] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountError, setDiscountError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)
  const [error, setError] = useState(null)

  const isBossMode = discountApplied && discountCode.toLowerCase() === 'bossmode'
  const displayTotal = isBossMode ? 1.00 : total

  const applyDiscount = () => {
    const code = discountInput.trim()
    if (code.toLowerCase() === 'bossmode') {
      setDiscountCode(code)
      setDiscountApplied(true)
      setDiscountError(null)
    } else {
      setDiscountError('Invalid discount code.')
    }
  }

  const mountEmbeddedCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const origin = window.location.origin
      const vaccineSuccessParams = new URLSearchParams({
        session_id: '{CHECKOUT_SESSION_ID}',
        puppy: dogName,
        puppyCount: puppyCount.toString(),
        mode: 'vaccines',
        total: total.toString(),
        consult: '0',
        vaccines: vaccinesTotal.toString(),
        freight: freightTotal.toString(),
        assist: assistTotal.toString(),
        insurance: insuranceTotal.toString(),
        insuranceBilling,
        items: params.get('items') || '[]',
      })
      const successUrl = isConsult
        ? params.get('successUrl') || `${origin}/plan?paid=1&puppy=${encodeURIComponent(dogName)}&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/order-confirmation?${vaccineSuccessParams.toString()}`
      const cancelUrl = params.get('cancelUrl') || `${origin}/checkout?${params.toString()}`

      const items = isConsult
        ? [{ name: `Consultation & vet review${puppyCount > 1 ? ` (${puppyCount} puppies)` : ''}`, description: 'AI health assessment, NZ-registered vet sign-off, personalised vaccination plan', price: consultFee }]
        : [
            ...vaccineItems.map((v) => ({ name: v.name, price: v.price })),
            ...(vaccineItems.length === 0 && vaccinesTotal > 0 ? [{ name: 'Vaccines', price: vaccinesTotal }] : []),
            ...(freightTotal > 0 ? [{ name: 'Cold-chain freight', price: freightTotal }] : []),
            ...(assistTotal > 0 ? [{ name: 'VetPac Assist — in-home vaccinator', price: assistTotal }] : []),
            ...(insuranceTotal > 0 ? [{ name: 'VetPac Programme Warranty', description: 'Covers vaccine failure and adverse reactions for your puppy\'s vaccination programme', price: insuranceTotal }] : []),
          ].filter((i) => i.price > 0)

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, dogName, successUrl, cancelUrl, discountCode: discountApplied ? discountCode : '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create payment session')

      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')

      // Destroy previous instance if remounting
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.destroy()
        checkoutInstanceRef.current = null
      }

      const checkout = await stripe.createEmbeddedCheckoutPage({ clientSecret: data.clientSecret })
      checkoutInstanceRef.current = checkout
      checkout.mount(checkoutRef.current)
      setStripeReady(true)
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.destroy()
      }
    }
  }, [])

  const backUrl = isConsult ? '/intake/review' : '/plan'
  const backLabel = isConsult ? '← Back to review' : '← Back to your plan'

  return (
    <div className="min-h-screen bg-bg py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-bold text-2xl text-primary">VetPac</Link>
          <p className="text-textMuted text-sm mt-1">
            {isConsult ? 'Consultation payment' : 'Confirm your plan'}
          </p>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-card-lg shadow-card overflow-hidden mb-4">
          <button
            onClick={() => setOrderOpen(!orderOpen)}
            className="w-full flex items-center justify-between p-5 border-b border-border hover:bg-bg transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-textPrimary">Order summary</span>
              {orderOpen ? <ChevronUp className="w-4 h-4 text-textMuted" /> : <ChevronDown className="w-4 h-4 text-textMuted" />}
            </div>
            <span className="font-mono font-bold text-accent">NZD ${displayTotal.toFixed(2)}</span>
          </button>

          {orderOpen && (
            <div className="p-5 space-y-3 bg-bg/50 border-b border-border">
              {isConsult ? (
                <LineItemRow
                  label={`Consultation & vet review${puppyCount > 1 ? ` (${puppyCount} puppies)` : ''}`}
                  description="AI health assessment · NZ vet sign-off · personalised vaccination plan"
                  price={consultFee}
                />
              ) : (
                <>
                  {vaccineItems.map((v, i) => <LineItemRow key={i} label={v.name} price={v.price} />)}
                  {vaccineItems.length === 0 && vaccinesTotal > 0 && <LineItemRow label="Vaccines" price={vaccinesTotal} />}
                  {freightTotal > 0 && <LineItemRow label="Cold-chain freight" description="2–8°C certified · temperature strip" price={freightTotal} />}
                  {assistTotal > 0 && <LineItemRow label="VetPac Assist — in-home vaccinator" price={assistTotal} />}
                  {insuranceTotal > 0 && (
                    <LineItemRow label="VetPac Programme Warranty" description="Covers vaccine failure & adverse reactions" price={insuranceTotal} />
                  )}
                </>
              )}
              <div className="border-t border-border pt-3 flex justify-between items-center font-semibold text-sm">
                <span className="text-textPrimary">Total (NZD, incl. GST)</span>
                <span className="font-mono text-accent text-base">NZD ${displayTotal.toFixed(2)}</span>
              </div>
              {isBossMode && (
                <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> BOSSMODE applied — $1.00 test charge
                </p>
              )}
              {!isConsult && <p className="text-xs text-textMuted">Consultation fee already paid.</p>}
            </div>
          )}
        </div>

        {/* Discount code — only show before Stripe mounts */}
        {!stripeReady && !loading && (
          <div className="bg-white rounded-card-lg shadow-card p-5 mb-4 space-y-3">
            {!discountApplied ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                  <input
                    type="text"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                    placeholder="Discount code (optional)"
                    className="w-full pl-9 pr-3 py-2.5 border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-bg"
                  />
                </div>
                <button
                  onClick={applyDiscount}
                  className="px-4 py-2.5 border border-border rounded-card text-sm font-medium text-textSecondary hover:bg-bg transition-colors flex-shrink-0"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-card text-sm text-green-800">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Code <strong>{discountCode.toUpperCase()}</strong> applied — NZD $1.00</span>
              </div>
            )}
            {discountError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {discountError}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-card-lg text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Payment unavailable</p>
              <p className="mt-0.5 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Proceed button — shown before Stripe mounts */}
        {!stripeReady && (
          <Button fullWidth size="lg" onClick={mountEmbeddedCheckout} loading={loading} disabled={loading}>
            {loading
              ? 'Setting up secure payment…'
              : `Pay NZD ${displayTotal.toFixed(2)} — Secure checkout →`}
          </Button>
        )}

        {/* Loading indicator while Stripe initialises */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-textMuted mt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading secure payment form…
          </div>
        )}

        {/* Embedded Stripe checkout mounts here */}
        <div ref={checkoutRef} className={stripeReady ? 'mt-4' : 'hidden'} />

        <div className="flex items-center justify-center gap-4 text-xs text-textMuted mt-5">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL secured</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Stripe encrypted</span>
          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> NZD · no conversion</span>
        </div>

        <p className="text-center text-xs text-textMuted mt-3">
          <Link to={backUrl} className="text-primary hover:underline">{backLabel}</Link>
        </p>
      </div>
    </div>
  )
}
