import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle, Lock, Package, Clock,
  Loader2, Info, ChevronDown, ChevronUp, Truck, Home,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import IntakeLayout from '../../components/layout/IntakeLayout'
import { useIntakeStore } from '../../store/intakeStore'
import { CONSULTATION_FEE, FREIGHT, ADDONS, SCALES, INSURANCE } from '../../lib/constants'
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
        label="Initial Consultation"
        sublabel="Fixed fee — full health assessment and personalised vaccination plan"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-semibold">Included with every programme</span>
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
      <p className="font-semibold text-textPrimary mb-1">Designing {dogName || 'your puppy'}'s plan</p>
      <p className="text-textMuted text-sm">Reviewing health history, breed, and lifestyle to build the right vaccination schedule…</p>
    </div>
  )
}

function VaccinePlanBuilder({ vaccinePlan, toggleVaccineItem, aiAssessment }) {
  const selectedCount = vaccinePlan.filter((v) => v.selected).length

  return (
    <div className="border-2 border-border rounded-card-lg p-5">
      <SectionHeading
        step="2"
        label="Your vaccine plan"
        sublabel="Based on your puppy's profile and health history. Deselect anything you don't need."
      />

      {aiAssessment?.treatment_plan?.health_status_assessment && (
        <div className="mb-4 p-3 bg-bg rounded-card border border-border text-sm text-textSecondary leading-relaxed">
          <p className="font-semibold text-textPrimary text-xs uppercase tracking-wider mb-1">Clinical note</p>
          {aiAssessment.treatment_plan.health_status_assessment}
        </div>
      )}

      {aiAssessment?.flags?.length > 0 && (
        <Alert type="warning" title="Flagged for review">
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
          Select at least one vaccine to continue.
        </Alert>
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
                  <Clock className="w-3 h-3" /> {item.scheduledDate}
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
                {infoOpen ? 'Hide note' : 'Why recommended?'}
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
  const saving = (totals.doseCount * ADDONS.ASSIST.price) - (totals.shipmentCount * FREIGHT.pricePerShipment)

  return (
    <div className="border-2 border-border rounded-card-lg p-5">
      <SectionHeading
        step="3"
        label="How would you like your vaccinations done?"
        sublabel="A VetPac technician is included by default. Most customers choose to save by doing it themselves."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">

        {/* Option A — Vaccinator comes to me (DEFAULT) */}
        <button
          type="button"
          onClick={() => setAssistSelected(true)}
          className={`text-left p-4 rounded-card border-2 transition-all duration-200
            ${assistSelected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'}`}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${assistSelected ? 'border-primary bg-primary' : 'border-border'}`}>
              {assistSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <Home className="w-4 h-4 text-primary" />
            <span className="font-semibold text-textPrimary text-sm">VetPac Assist — we come to you</span>
            <span className="text-xs bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">Included</span>
          </div>
          <p className="text-xs text-textMuted leading-relaxed ml-6">
            A trained VetPac technician comes to your home and administers every dose. Nothing for you to do.
          </p>
          <p className="text-xs font-semibold text-primary mt-2 ml-6">
            NZD ${ADDONS.ASSIST.price} × {totals.doseCount} visit{totals.doseCount !== 1 ? 's' : ''} = NZD ${totals.doseCount * ADDONS.ASSIST.price}
          </p>
        </button>

        {/* Option B — DIY (SAVES MONEY) */}
        <button
          type="button"
          onClick={() => setAssistSelected(false)}
          className={`text-left p-4 rounded-card border-2 transition-all duration-200 relative
            ${!assistSelected ? 'border-accent bg-accent/5' : 'border-border bg-white hover:border-accent/40'}`}
        >
          {saving > 0 && (
            <span className="absolute top-3 right-3 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
              Save NZD ${saving}
            </span>
          )}
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${!assistSelected ? 'border-accent bg-accent' : 'border-border'}`}>
              {!assistSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <Truck className="w-4 h-4 text-accent" />
            <span className="font-semibold text-textPrimary text-sm">I'll do it myself</span>
          </div>
          <p className="text-xs text-textMuted leading-relaxed ml-6">
            Full step-by-step guidance included. Everything you need is in the kit. Our 0800 line is available around the clock.
          </p>
          <p className="text-xs font-semibold text-accent mt-2 ml-6">
            NZD ${FREIGHT.pricePerShipment} × {totals.shipmentCount} delivery{totals.shipmentCount !== 1 ? 's' : ''} = NZD ${totals.shipmentCount * FREIGHT.pricePerShipment}
          </p>
        </button>

      </div>
    </div>
  )
}

function ScalesOffer() {
  return (
    <div className="border-2 border-accent/40 bg-accent/5 rounded-card-lg p-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">🎁</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <p className="font-bold text-textPrimary text-sm">{SCALES.name} — free with your programme</p>
            <span className="text-xs bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded-full">Introductory offer</span>
          </div>
          <p className="text-xs text-textMuted leading-relaxed mb-2">
            {SCALES.description} Scales are included so you can weigh your puppy before each dose and confirm correct dosing — exactly how a clinic would.
          </p>
          <p className="text-sm font-semibold">
            <span className="line-through text-textMuted font-normal mr-2">NZD ${SCALES.retailPrice}.00</span>
            <span className="text-accent">Free — added to your order automatically</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function InsuranceBlock({ insuranceSelected, setInsuranceSelected, insuranceBilling, setInsuranceBilling }) {
  return (
    <div className="border-2 border-border rounded-card-lg p-5">
      <SectionHeading
        step="4"
        label="Add health cover"
        sublabel="Protect your puppy against accidents and illness beyond the vaccination programme."
      />

      <div className={`rounded-card border-2 p-4 transition-all duration-200 ${insuranceSelected ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-bold text-textPrimary text-sm">{INSURANCE.name}</p>
              <span className="text-xs bg-warning/15 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Introductory offer</span>
            </div>
            <p className="text-xs text-textMuted mb-2.5">
              Accident and illness cover. Up to NZD ${INSURANCE.coverLimit.toLocaleString()}/year. Provided by Forman Pacific LLC.
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm line-through text-textMuted">${INSURANCE.weeklyRetailPrice}/wk</span>
              <span className="font-bold text-primary text-xl">${INSURANCE.weeklyIntroPrice}<span className="text-sm font-normal text-textSecondary">/week</span></span>
              <span className="text-xs text-textMuted">intro rate</span>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setInsuranceSelected(!insuranceSelected)}
            className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 relative mt-1 ${insuranceSelected ? 'bg-primary' : 'bg-border'}`}
            aria-label="Toggle insurance"
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${insuranceSelected ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        </div>

        {insuranceSelected && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-xs font-semibold text-textPrimary mb-2">Billing preference</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setInsuranceBilling('annual')}
                className={`text-left p-3 rounded-card border-2 transition-all ${insuranceBilling === 'annual' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <p className="font-semibold text-textPrimary text-xs mb-0.5">Annual billing</p>
                <p className="font-mono font-bold text-primary text-sm">NZD ${INSURANCE.annualPrice}/yr</p>
                <p className="text-[10px] text-green-600 font-medium mt-0.5">Save NZD ${Math.round(INSURANCE.monthlyPrice * 12 - INSURANCE.annualPrice)} vs monthly</p>
              </button>
              <button
                onClick={() => setInsuranceBilling('monthly')}
                className={`text-left p-3 rounded-card border-2 transition-all ${insuranceBilling === 'monthly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <p className="font-semibold text-textPrimary text-xs mb-0.5">Monthly billing</p>
                <p className="font-mono font-bold text-primary text-sm">NZD ${INSURANCE.monthlyPrice}/mo</p>
                <p className="text-[10px] text-textMuted mt-0.5">NZD ${(INSURANCE.monthlyPrice * 12).toFixed(2)}/year</p>
              </button>
            </div>
            <p className="text-xs text-textMuted leading-relaxed">
              Introductory rate locked in for the life of your policy. Cancel within 14 days for a full refund.{' '}
              <Link to="/insurance-terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                View full terms →
              </Link>
            </p>
          </div>
        )}

        {!insuranceSelected && (
          <p className="text-xs text-textMuted mt-2">Covers vet bills for accidents, illness, surgery, and emergency care. You can add this at any time.</p>
        )}
      </div>
    </div>
  )
}

function OrderSummary({ totals, ownerDetails }) {
  return (
    <div className="bg-bg rounded-card-lg border border-border p-5">
      <h3 className="font-semibold text-textPrimary mb-4">Order summary</h3>

      <div className="flex items-start gap-2 mb-4 pb-4 border-b border-border">
        <Package className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-0.5">Address</p>
          <p className="text-sm text-textSecondary">
            {[ownerDetails.address_line1, ownerDetails.address_line2, ownerDetails.city, ownerDetails.postcode].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Consultation</span>
          <span className="font-mono font-semibold">NZD ${totals.consultation}.00</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Vaccines</span>
          <span className="font-mono font-semibold">NZD ${totals.vaccines}.00</span>
        </div>
        {totals.assist > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">VetPac Assist ({totals.doseCount} visit{totals.doseCount !== 1 ? 's' : ''})</span>
            <span className="font-mono font-semibold">NZD ${totals.assist}.00</span>
          </div>
        )}
        {totals.freight > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">Delivery ({totals.shipmentCount} shipment{totals.shipmentCount !== 1 ? 's' : ''})</span>
            <span className="font-mono font-semibold">NZD ${totals.freight}.00</span>
          </div>
        )}
        {totals.insurance > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">VetPac Health Cover ({totals.insuranceBilling === 'annual' ? 'first year' : 'first month'})</span>
            <span className="font-mono font-semibold">NZD ${totals.insurance.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <span className="font-bold text-textPrimary">Total (NZD, incl. GST)</span>
        <span className="font-mono font-bold text-2xl text-accent">NZD ${totals.total.toFixed(2)}</span>
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
    insuranceSelected, setInsuranceSelected,
    insuranceBilling, setInsuranceBilling,
    getOrderTotals,
  } = useIntakeStore()

  const [aiLoading, setAiLoading] = useState(!aiAssessment)
  const [aiError, setAiError] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (!aiAssessment) runAi()
  }, [])

  const runAi = async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await generateTreatmentPlan({ dogProfile, healthHistory, lifestyle })
      setAiAssessment(result)
    } catch {
      setAiError('Assessment unavailable — a standard plan has been set for your puppy\'s age. We will review it before anything is confirmed.')
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
      puppy: dogProfile.name,
      total: totals.total.toFixed(2),
      consult: totals.consultation.toString(),
      vaccines: totals.vaccines.toString(),
      freight: totals.freight.toString(),
      assist: totals.assist.toString(),
      insurance: totals.insurance.toFixed(2),
      insuranceBilling: totals.insuranceBilling,
      items: encodeURIComponent(JSON.stringify(selectedVaccines.map((v) => ({ name: v.name, price: v.price })))),
    })
    navigate(`/checkout?${params.toString()}`)
    setCheckoutLoading(false)
  }

  return (
    <IntakeLayout>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">
          Your vaccination plan
        </h1>
        <p className="text-textSecondary">
          Review your plan, choose how you want it done, and confirm.
        </p>
      </div>

      {/* puppy profile pill */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-bg rounded-card border border-border">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl flex-shrink-0">🐕</div>
        <div>
          <p className="font-bold text-textPrimary">{dogProfile.name || 'Your puppy'}</p>
          <p className="text-textMuted text-xs">{dogProfile.breed} · {dogProfile.sex} · {dogProfile.weight_kg ? `${dogProfile.weight_kg}kg` : 'weight to be confirmed'}</p>
        </div>
        {aiAssessment && !aiLoading && (
          <div className="ml-auto flex items-center gap-1.5 text-success text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> Plan ready
          </div>
        )}
      </div>

      {/* Referral blocker */}
      {referral && (
        <div className="mb-6">
          <Alert type="error" title="In-person visit recommended before vaccinating">
            {aiAssessment.referral_reason || 'Our assessment has flagged something that needs a physical examination first.'}
            <p className="mt-2 font-medium">You will not be charged. A full summary has been sent to you.</p>
          </Alert>
        </div>
      )}

      {!referral && (
        <div className="space-y-4">
          {/* Step 1: Consultation */}
          <ConsultationBlock />

          {/* Step 2: Vaccine plan */}
          {aiLoading ? (
            <AiLoadingState dogName={dogProfile.name} />
          ) : (
            <>
              {aiError && <Alert type="warning" title="Using standard plan">{aiError}</Alert>}
              <VaccinePlanBuilder
                vaccinePlan={vaccinePlan}
                toggleVaccineItem={toggleVaccineItem}
                aiAssessment={aiAssessment}
              />
            </>
          )}

          {!aiLoading && (
            <>
              {/* Step 3: Delivery method */}
              <DeliveryMethodBlock
                assistSelected={assistSelected}
                setAssistSelected={setAssistSelected}
                totals={totals}
              />

              {/* Scales offer — only shown when DIY selected */}
              {!assistSelected && <ScalesOffer />}

              {/* Step 4: Insurance upsell */}
              <InsuranceBlock
                insuranceSelected={insuranceSelected}
                setInsuranceSelected={setInsuranceSelected}
                insuranceBilling={insuranceBilling}
                setInsuranceBilling={setInsuranceBilling}
              />

              {/* Order summary */}
              <OrderSummary totals={totals} ownerDetails={ownerDetails} />

              <Button
                fullWidth
                size="xl"
                onClick={handleCheckout}
                loading={checkoutLoading}
                disabled={selectedVaccines.length === 0}
              >
                Pay now — NZD ${totals.total.toFixed(2)} →
              </Button>
              <p className="text-xs text-textMuted text-center">
                Secure payment via Stripe. SSL encrypted. No card details stored.
              </p>
            </>
          )}
        </div>
      )}
    </IntakeLayout>
  )
}
