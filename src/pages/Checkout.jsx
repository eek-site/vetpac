import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Lock, Shield, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '../components/ui/Button'
import { CONSULTATION_FEE, FREIGHT } from '../lib/constants'

function LineItemRow({ label, price, muted = false }) {
  return (
    <div className={`flex justify-between items-center text-sm ${muted ? 'text-textMuted' : ''}`}>
      <span className={muted ? 'text-textMuted' : 'text-textSecondary'}>{label}</span>
      <span className="font-mono font-semibold text-textPrimary">NZD ${Number(price).toFixed(2)}</span>
    </div>
  )
}

export default function Checkout() {
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(false)
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
    await new Promise((r) => setTimeout(r, 1200))
    window.location.href = `/order-confirmation?session_id=demo_${Date.now()}&dog=${encodeURIComponent(dogName)}`
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
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
              {orderOpen ? <ChevronUp className="w-4 h-4 text-textMuted" /> : <ChevronDown className="w-4 h-4 text-textMuted" />}
            </div>
            <span className="font-mono font-bold text-accent">NZD ${total.toFixed(2)}</span>
          </button>

          {orderOpen && (
            <div className="p-5 border-b border-border space-y-2.5 bg-bg/50">
              <LineItemRow label="Consultation & vet review" price={consultFee} />
              {vaccineItems.map((v, i) => (
                <LineItemRow key={i} label={v.name} price={v.price} />
              ))}
              {vaccineItems.length === 0 && vaccinesTotal > 0 && (
                <LineItemRow label="Vaccines" price={vaccinesTotal} />
              )}
              <LineItemRow label="Cold-chain freight" price={freightTotal} />
              {assistTotal > 0 && <LineItemRow label="VetPac Assist" price={assistTotal} />}
              <div className="border-t border-border pt-2.5 flex justify-between items-center font-semibold text-sm">
                <span className="text-textPrimary">Total (NZD, incl. GST)</span>
                <span className="font-mono text-accent text-base">NZD ${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Payment form */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm text-textSecondary">
              <Lock className="w-4 h-4 text-primary" />
              <span>Payment secured by Stripe — 256-bit encryption</span>
            </div>

            {/* Stripe Elements placeholder */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1.5">Card number</label>
                <div className="border border-border rounded-card px-4 py-3 bg-bg text-textMuted text-sm">•••• •••• •••• ••••</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1.5">Expiry</label>
                  <div className="border border-border rounded-card px-4 py-3 bg-bg text-textMuted text-sm">MM / YY</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1.5">CVC</label>
                  <div className="border border-border rounded-card px-4 py-3 bg-bg text-textMuted text-sm">•••</div>
                </div>
              </div>
            </div>

            <Button fullWidth size="lg" onClick={handlePayment} loading={loading}>
              Pay NZD ${total.toFixed(2)} →
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-textMuted pt-1">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SSL secured</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> No card data stored</span>
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
