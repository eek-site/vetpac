import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, Lock, Package, Clock,
  Loader2, Info, ChevronDown, ChevronUp, Syringe, Truck, Home
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import IntakeLayout from '../../components/layout/IntakeLayout'
import { useIntakeStore } from '../../store/intakeStore'
import { CONSULTATION_FEE, FREIGHT, ADDONS } from '../../lib/constants'
import { generateTreatmentPlan } from '../../lib/claude'

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeading({ step, label, sublabel }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <h3 className="font-semibold text-textPrimary">{label}</h3>
        {sublabel && <p className="text-textMuted text-sm mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}

function ConsultationBlock() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border-2 border-primary/20 bg-primary/5 rounded-card-lg p-5">
      <SectionHeading
        step="1"
        label="Consultation & Vet Review"
        sublabel="Fixed fee — covers AI intake, NZ vet assessment, and VOI issuance"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-semibold">Included with every order</span>
        </div>
        <span className="font-mono font-bold text-xl text-primary">NZD ${CONSULTATION_FEE.price}.00</span>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-xs text-textMuted flex items-center gap-1 hover:text-primary transition-colors"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        What does this cover?
      </button>
      {expanded && (
        <ul className="mt-3 space-y-1.5">
          {CONSULTATION_FEE.includes.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-textSecondary">
              <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AiLoadingState({ dogName }) {
  return (
    <div className="border-2 border-border rounded-card-lg p-8 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      <p className="font-semibold text-textPrimary mb-1">Analysing {dogName || 'your dog'}'s intake</p>
      <p className="text-textMuted text-sm">Our AI is reviewing the health history and lifestyle responses to determine the right vaccine plan…</p>
    </div>
  )
}

function VaccinePlanBuilder({ vaccinePlan, toggleVaccineItem, aiAssessment }) {
  const selectedCount = vaccinePlan.filter((v) => v.selected).length
  const hasRecommended = vaccinePlan.some((v) => v.recommended)

  return (
    <div className="border-2 border-border rounded-card-lg p-5">
      <SectionHeading
        step="2"
        label="Your vaccine plan"
        sublabel="Based on your dog's profile, history, and the AI assessment. Deselect any item you don't need."
      />

      {aiAssessment?.treatment_plan?.health_status_assessment && (
        <div className="mb-4 p-3 bg-bg rounded-card border border-border text-sm text-textSecondary leading-relaxed">
          <p className="font-semibold text-textPrimary text-xs uppercase tracking-wider mb-1">Vet's clinical note</p>
          {aiAssessment.treatment_plan.health_status_assessment}
        </div>
      )}

      {aiAssessment?.flags?.length > 0 && (
        <Alert type="warning" title="Flagged for vet review">
          {aiAssessment.flags.join(' • ')}
        </Alert>
      )}

      <div className="space-y-3 mt-4">
        {vaccinePlan.map((item) => (
          <VaccineLineItem key={item.id} item={item} onToggle={() => toggleVaccineItem(item.id)} />
        ))}
      </div>

      {selectedCount === 0 && (
        <Alert type="warning" title="No vaccines selected">
          You need to select at least one vaccine to proceed with your order.
        </Alert>
      )}

      {hasRecommended && (
        <p className="mt-4 text-xs text-textMuted flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-textMuted" />
          All items are AI-recommended based on your dog's profile. The reviewing vet may add clinical notes when they sign off your VOI.
        </p>
      )}
    </div>
  )
}

function VaccineLineItem({ item, onToggle }) {
  const [infoOpen, setInfoOpen] = useState(false)
  return (
    <div className={`rounded-card border-2 transition-all duration-200 ${item.selected ? 'border-primary bg-white' : 'border-border bg-bg opacity-60'}`}>
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
            ${item.selected ? 'bg-primary border-primary' : 'bg-white border-border hover:border-primary-light'}`}
        >
          {item.selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-textPrimary text-sm">{item.name}</span>
                {item.doseNumber && (
                  <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                    Dose {item.doseNumber}
                  </span>
                )}
                {item.recommended && (
                  <span className="text-xs bg-success/10 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-textMuted mt-0.5">{item.fullName}</p>
              {item.scheduledDate && (
                <p className="text-xs text-textMuted flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> Ships: {item.scheduledDate}
                </p>
              )}
            </div>
            <span className="font-mono font-bold text-accent text-sm flex-shrink-0">
              NZD ${item.price}.00
            </span>
          </div>

          {item.note && (
            <>
              <button
                onClick={() => setInfoOpen(!infoOpen)}
                className="mt-2 text-xs text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
              >
                <Info className="w-3 h-3" />
                {infoOpen ? 'Hide reason' : 'Why recommended?'}
              </button>
              {infoOpen && (
                <p className="mt-2 text-xs text-textSecondary bg-bg rounded-lg p-2 leading-relaxed">{item.note}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DeliveryMethodBlock({ assistSelected, setAssistSelected, totals }) {
  return (
    <div className="border-2 border-border rounded-card-lg p-5">
      <SectionHeading
        step="3"
        label="How would you like to do this?"
        sublabel="Choose how your vaccines are delivered and administered."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">

        {/* Option A — Ship to me */}
        <button
          type="button"
          onClick={() => setAssistSelected(false)}
          className={`text-left p-4 rounded-card border-2 transition-all duration-200
            ${!assistSelected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${!assistSelected ? 'border-primary bg-primary' : 'border-border'}`}>
              {!assistSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <Truck className="w-4 h-4 text-primary" />
            <span className="font-semibold text-textPrimary text-sm">Ship to me — I'll do it</span>
          </div>
          <p className="text-xs text-textMuted leading-relaxed ml-6">
            Vaccines delivered cold-chain to your door. Step-by-step guide and everything you need is in the box.
          </p>
          <p className="text-xs font-semibold text-primary mt-2 ml-6">
            NZD ${FREIGHT.pricePerShipment} × {totals.shipmentCount} delivery{totals.shipmentCount !== 1 ? 's' : ''} = ${totals.shipmentCount * FREIGHT.pricePerShipment}
          </p>
        </button>

        {/* Option B — Vaccinator comes to me */}
        <button
          type="button"
          onClick={() => setAssistSelected(true)}
          className={`text-left p-4 rounded-card border-2 transition-all duration-200
            ${assistSelected ? 'border-accent bg-accent/5' : 'border-border bg-white hover:border-accent/40'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${assistSelected ? 'border-accent bg-accent' : 'border-border'}`}>
              {assistSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <Home className="w-4 h-4 text-accent" />
            <span className="font-semibold text-textPrimary text-sm">Send a vaccinator to me</span>
            <span className="text-xs bg-accent/10 text-accent font-semibold px-1.5 py-0.5 rounded-full">Auckland</span>
          </div>
          <p className="text-xs text-textMuted leading-relaxed ml-6">
            A trained VetPac technician comes to your home, brings the vaccines, and administers them for you. No delivery charge.
          </p>
          <p className="text-xs font-semibold text-accent mt-2 ml-6">
            NZD ${ADDONS.ASSIST.price} × {totals.doseCount} visit{totals.doseCount !== 1 ? 's' : ''} = ${totals.doseCount * ADDONS.ASSIST.price}
          </p>
        </button>

      </div>
    </div>
  )
}

function OrderSummary({ totals, ownerDetails }) {
  return (
    <div className="bg-bg rounded-card-lg border border-border p-5">
      <h3 className="font-semibold text-textPrimary mb-4">Order summary</h3>

      {/* Delivery address */}
      <div className="flex items-start gap-2 mb-4 pb-4 border-b border-border">
        <Package className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-0.5">Delivering to</p>
          <p className="text-sm text-textSecondary">
            {[ownerDetails.address_line1, ownerDetails.address_line2, ownerDetails.city, ownerDetails.postcode].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Initial consultation</span>
          <span className="font-mono font-semibold">NZD ${totals.consultation}.00</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Vaccines</span>
          <span className="font-mono font-semibold">NZD ${totals.vaccines}.00</span>
        </div>
        {totals.freight > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">Cold-chain delivery ({totals.shipmentCount} shipment{totals.shipmentCount !== 1 ? 's' : ''})</span>
            <span className="font-mono font-semibold">NZD ${totals.freight}.00</span>
          </div>
        )}
        {totals.assist > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">In-home vaccinator ({totals.doseCount} visit{totals.doseCount !== 1 ? 's' : ''})</span>
            <span className="font-mono font-semibold">NZD ${totals.assist}.00</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <span className="font-bold text-textPrimary">Total (NZD, incl. GST)</span>
        <span className="font-mono font-bold text-2xl text-accent">NZD ${totals.total}.00</span>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Step6Review() {
  const navigate = useNavigate()
  const {
    dogProfile, healthHistory, lifestyle, ownerDetails,
    aiAssessment, setAiAssessment,
    vaccinePlan, toggleVaccineItem,
    assistSelected, setAssistSelected,
    getOrderTotals,
  } = useIntakeStore()

  const [aiLoading, setAiLoading] = useState(!aiAssessment)
  const [aiError, setAiError] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Auto-run AI assessment when landing on this page
  useEffect(() => {
    if (!aiAssessment) {
      runAi()
    }
  }, [])

  const runAi = async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await generateTreatmentPlan({ dogProfile, healthHistory, lifestyle })
      setAiAssessment(result) // also builds vaccinePlan via store action
    } catch {
      setAiError('AI assessment unavailable — a vet will still review your intake manually. Your vaccine plan has been set to the standard course for your dog\'s age.')
      // Set fallback assessment so vaccinePlan gets built
      setAiAssessment(null)
    } finally {
      setAiLoading(false)
    }
  }

  const totals = getOrderTotals()
  const referral = aiAssessment?.refer_to_in_person_vet
  const selectedVaccines = vaccinePlan.filter((v) => v.selected)

  const handleCheckout = async () => {
    if (selectedVaccines.length === 0) return
    setCheckoutLoading(true)
    const params = new URLSearchParams({
      dog: dogProfile.name,
      total: totals.total.toString(),
      consult: totals.consultation.toString(),
      vaccines: totals.vaccines.toString(),
      freight: totals.freight.toString(),
      assist: assistSelected ? totals.assist.toString() : '0',
      items: encodeURIComponent(JSON.stringify(selectedVaccines.map((v) => ({ name: v.name, price: v.price })))),
    })
    navigate(`/checkout?${params.toString()}`)
    setCheckoutLoading(false)
  }

  return (
    <IntakeLayout>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">
          Review your plan
        </h1>
        <p className="text-textSecondary">
          Your vaccine plan is below. Adjust if needed, choose how you want it delivered, then confirm.
        </p>
      </div>

      {/* Dog profile pill */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-bg rounded-card border border-border">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl flex-shrink-0">🐕</div>
        <div>
          <p className="font-bold text-textPrimary">{dogProfile.name || 'Your dog'}</p>
          <p className="text-textMuted text-xs">{dogProfile.breed} · {dogProfile.sex} · {dogProfile.weight_kg ? `${dogProfile.weight_kg}kg` : 'weight not set'}</p>
        </div>
        {aiAssessment && !aiLoading && (
          <div className="ml-auto flex items-center gap-1.5 text-success text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> AI assessed
          </div>
        )}
      </div>

      {/* Referral blocker */}
      {referral && (
        <div className="mb-6">
          <Alert type="error" title="In-person vet visit required before vaccinating">
            {aiAssessment.referral_reason || 'Our AI assessment has flagged a concern that requires a physical examination first.'}
            <p className="mt-2 font-medium">You will not be charged. A full summary has been emailed to you.</p>
          </Alert>
        </div>
      )}

      {!referral && (
        <div className="space-y-4">
          {/* Stage 1: Consultation (locked) */}
          <ConsultationBlock />

          {/* Stage 2: Vaccine plan */}
          {aiLoading ? (
            <AiLoadingState dogName={dogProfile.name} />
          ) : (
            <>
              {aiError && (
                <Alert type="warning" title="Using standard plan">
                  {aiError}
                </Alert>
              )}
              <VaccinePlanBuilder
                vaccinePlan={vaccinePlan}
                toggleVaccineItem={toggleVaccineItem}
                aiAssessment={aiAssessment}
              />
            </>
          )}

          {/* Stage 3: Delivery method */}
          {!aiLoading && (
            <DeliveryMethodBlock
              assistSelected={assistSelected}
              setAssistSelected={setAssistSelected}
              totals={totals}
            />
          )}

          {/* Order summary + CTA */}
          {!aiLoading && (
            <>
              <OrderSummary totals={totals} ownerDetails={ownerDetails} />

              <Button
                fullWidth
                size="xl"
                onClick={handleCheckout}
                loading={checkoutLoading}
                disabled={selectedVaccines.length === 0}
              >
                Proceed to payment — NZD ${totals.total} →
              </Button>
              <p className="text-xs text-textMuted text-center">
                Secure payment via Stripe. Your order is confirmed and dispatched within 24 hours.
              </p>
            </>
          )}
        </div>
      )}
    </IntakeLayout>
  )
}
