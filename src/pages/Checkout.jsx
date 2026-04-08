import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Lock, Shield, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import { CONSULTATION_FEE, FREIGHT } from '../lib/constants'

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

  const dogName = params.get('dog') || 'your dog'
  const total = parseFloat(params.get('total') || '0')
  const consultFee = parseFloat(params.get('consult') || CONSULTATION_FEE.price)
  const vaccinesTotal = parseFloat(params.get('vaccines') || '0')
  const freightTotal = parseFloat(params.get('freight') || '0')
  const assistTotal = parseFloat(params.get('assist') || '0')

  let vaccineItems = []
  try {
    vaccineItems = JSON.parse(decodeURIComponent(params.get('items') || '[]'))
  } catch {}

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      // Build line items for Stripe — consultation, vaccines, freight, assist
      const items = [
        {
          name: 'Consultation & Vet Review',
          description: 'AI intake, NZ-registered vet review, VOI issuance for full vaccine course',
          price: consultFee,
        },
        ...vaccineItems.map((v) => ({ name: v.name, price: v.price })),
        // Fallback if no itemised vaccines (shouldn't happen in normal flow)
        ...(vaccineItems.length === 0 && vaccinesTotal > 0
          ? [{ name: 'Vaccines', price: vaccinesTotal }]
          : []),
        {
          name: 'Cold-chain freight',
          description: 'Pharmaceutical-grade 2–8°C courier, temperature indicator strip, signature required',
          price: freightTotal,
        },
        ...(assistTotal > 0
          ? [{ name: 'In-home vaccinator', description: 'Trained technician brings and administers vaccines at your home', price: assistTotal }]
          : []),
      ].filter((item) => item.price > 0)

      const origin = window.location.origin
      const successUrl = `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}&dog=${encodeURIComponent(dogName)}`
      const cancelUrl = `${origin}/checkout?${params.toString()}`

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, dogName, successUrl, cancelUrl }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Could not create payment session')

      // Redirect to Stripe hosted checkout
      window.location.href = data.url
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-bold text-2xl text-primary">VetPac</Link>
          <p className="text-textMuted text-sm mt-1">Secure checkout</p>
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
              <LineItemRow
                label="Consultation & vet review"
                description="AI intake · NZ vet sign-off · VOI issued"
                price={consultFee}
              />
              {vaccineItems.map((v, i) => (
                <LineItemRow key={i} label={v.name} price={v.price} />
              ))}
              {vaccineItems.length === 0 && vaccinesTotal > 0 && (
                <LineItemRow label="Vaccines" price={vaccinesTotal} />
              )}
              <LineItemRow
                label="Cold-chain freight"
                description="2–8°C certified · temperature strip · signature required"
                price={freightTotal}
              />
              {assistTotal > 0 && (
                <LineItemRow label="In-home vaccinator" description="Trained technician brings and administers vaccines at your home" price={assistTotal} />
              )}
              <div className="border-t border-border pt-3 flex justify-between items-center font-semibold text-sm">
                <span className="text-textPrimary">Total (NZD, incl. GST)</span>
                <span className="font-mono text-accent text-base">NZD ${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Payment section */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm text-textSecondary">
              <Lock className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Payment secured by Stripe — 256-bit TLS encryption. Card details handled entirely by Stripe.</span>
            </div>

            {/* Stripe brand + what happens next */}
            <div className="bg-bg rounded-card border border-border p-4 space-y-2 text-sm text-textSecondary">
              <p className="font-semibold text-textPrimary text-xs uppercase tracking-wider mb-2">What happens when you click Pay</p>
              <ol className="space-y-1.5 list-none">
                {[
                  'You\'ll be taken to Stripe\'s secure payment page',
                  'Enter your card details on Stripe\'s hosted form',
                  'Payment processed in NZD — no currency conversion for NZ cardholders',
                  'You\'re returned here the moment payment is confirmed',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Error */}
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
              By paying you confirm you have read and agree to VetPac's{' '}
              <Link to="/terms" className="text-primary underline">Terms of Service</Link>{' '}
              and understand the VOI administration model.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-textMuted mt-5">
          <Link to="/intake/review" className="text-primary hover:underline">← Back to review your plan</Link>
        </p>
      </div>
    </div>
  )
}
