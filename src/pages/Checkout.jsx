import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Lock, Shield, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import Button from '../components/ui/Button'

function LineItemRow({ label, description, price, muted = false }) {
  return (
    <div className={`flex justify-between items-start gap-4 text-sm ${muted ? 'opacity-60' : ''}`}>
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [orderOpen, setOrderOpen] = useState(true)

  const mode = params.get('mode') || 'consult' // 'consult' | 'vaccines'
  const isConsult = mode === 'consult'
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
  try {
    vaccineItems = JSON.parse(decodeURIComponent(params.get('items') || '[]'))
  } catch {}

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const origin = window.location.origin
      const successUrl = isConsult
        ? params.get('successUrl') || `${origin}/plan?paid=1&puppy=${encodeURIComponent(dogName)}`
        : `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}&puppy=${encodeURIComponent(dogName)}`
      const cancelUrl = params.get('cancelUrl') || `${origin}/checkout?${params.toString()}`

      // Build Stripe line items based on mode
      const items = isConsult
        ? [{
            name: `Consultation & vet review${puppyCount > 1 ? ` (${puppyCount} puppies)` : ''}`,
            description: 'AI health assessment, NZ-registered vet sign-off, personalised vaccination plan',
            price: consultFee,
          }]
        : [
            ...vaccineItems.map((v) => ({ name: v.name, price: v.price })),
            ...(vaccineItems.length === 0 && vaccinesTotal > 0
              ? [{ name: 'Vaccines', price: vaccinesTotal }]
              : []),
            ...(freightTotal > 0
              ? [{ name: 'Cold-chain freight', description: '2–8°C certified courier · temperature indicator strip', price: freightTotal }]
              : []),
            ...(assistTotal > 0
              ? [{ name: 'VetPac Assist — in-home vaccinator', description: 'Trained technician administers vaccines at your home', price: assistTotal }]
              : []),
            ...(insuranceTotal > 0
              ? [{ name: `VetPac Cover (${insuranceBilling === 'twoYear' ? '2-year upfront' : insuranceBilling})`, price: insuranceTotal }]
              : []),
          ].filter((item) => item.price > 0)

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, dogName, successUrl, cancelUrl }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not create payment session')
      window.location.href = data.url
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const backUrl = isConsult ? '/intake/review' : '/plan'
  const backLabel = isConsult ? '← Back to review' : '← Back to your plan'

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-bold text-2xl text-primary">VetPac</Link>
          <p className="text-textMuted text-sm mt-1">
            {isConsult ? 'Consultation payment' : 'Confirm your plan'}
          </p>
        </div>

        <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
          {/* Order summary toggle */}
          <button
            onClick={() => setOrderOpen(!orderOpen)}
            className="w-full flex items-center justify-between p-5 border-b border-border hover:bg-bg transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-textPrimary">Order summary</span>
              {orderOpen
                ? <ChevronUp className="w-4 h-4 text-textMuted" />
                : <ChevronDown className="w-4 h-4 text-textMuted" />}
            </div>
            <span className="font-mono font-bold text-accent">NZD ${total.toFixed(2)}</span>
          </button>

          {orderOpen && (
            <div className="p-5 border-b border-border space-y-3 bg-bg/50">
              {isConsult ? (
                <LineItemRow
                  label={`Consultation & vet review${puppyCount > 1 ? ` (${puppyCount} puppies)` : ''}`}
                  description="AI health assessment · NZ vet sign-off · personalised vaccination plan"
                  price={consultFee}
                />
              ) : (
                <>
                  {vaccineItems.map((v, i) => (
                    <LineItemRow key={i} label={v.name} price={v.price} />
                  ))}
                  {vaccineItems.length === 0 && vaccinesTotal > 0 && (
                    <LineItemRow label="Vaccines" price={vaccinesTotal} />
                  )}
                  {freightTotal > 0 && (
                    <LineItemRow
                      label="Cold-chain freight"
                      description="2–8°C certified · temperature strip · signature required"
                      price={freightTotal}
                    />
                  )}
                  {assistTotal > 0 && (
                    <LineItemRow
                      label="VetPac Assist — in-home vaccinator"
                      description="Trained technician brings and administers vaccines at your home"
                      price={assistTotal}
                    />
                  )}
                  {insuranceTotal > 0 && (
                    <LineItemRow
                      label={`VetPac Cover (${insuranceBilling === 'twoYear' ? '2-year upfront' : insuranceBilling})`}
                      price={insuranceTotal}
                    />
                  )}
                </>
              )}
              <div className="border-t border-border pt-3 flex justify-between items-center font-semibold text-sm">
                <span className="text-textPrimary">Total (NZD, incl. GST)</span>
                <span className="font-mono text-accent text-base">NZD ${total.toFixed(2)}</span>
              </div>
              {!isConsult && (
                <p className="text-xs text-textMuted">Consultation fee already paid separately.</p>
              )}
            </div>
          )}

          {/* Payment section */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm text-textSecondary">
              <Lock className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Payment secured by Stripe — 256-bit TLS encryption. Card details handled entirely by Stripe.</span>
            </div>

            <div className="bg-bg rounded-card border border-border p-4 space-y-2 text-sm text-textSecondary">
              <p className="font-semibold text-textPrimary text-xs uppercase tracking-wider mb-2">What happens next</p>
              <ol className="space-y-1.5 list-none">
                {(isConsult ? [
                  'You\'ll be taken to Stripe\'s secure payment page',
                  'Payment processed in NZD — no currency conversion',
                  'Your personalised plan is immediately unlocked',
                  'Choose your vaccines, delivery method, and confirm',
                ] : [
                  'You\'ll be taken to Stripe\'s secure payment page',
                  'Payment processed in NZD — no currency conversion',
                  'Vaccines confirmed and dispatched on your schedule',
                  'Your vaccination certificate is issued on completion',
                ]).map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-card text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button fullWidth size="lg" onClick={handlePayment} loading={loading}>
              Pay NZD ${total.toFixed(2)} with Stripe →
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-textMuted pt-1">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SSL secured</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> No card data stored</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Stripe encrypted</span>
            </div>

            <p className="text-xs text-textMuted text-center leading-relaxed">
              By paying you agree to VetPac's{' '}
              <Link to="/terms" className="text-primary underline">Terms of Service</Link>.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-textMuted mt-5">
          <Link to={backUrl} className="text-primary hover:underline">{backLabel}</Link>
        </p>
      </div>
    </div>
  )
}
