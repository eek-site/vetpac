import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  CheckCircle, Lock, Loader2, Info, ChevronDown, ChevronUp,
  Truck, Home, Shield, Heart, Star, AlertCircle,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { useIntakeStore, buildVaccinePlan } from '../store/intakeStore'
import { FREIGHT, ADDONS, SCALES, INSURANCE, calculateConsultFee, REGIONAL_CONSULTATION_FEES } from '../lib/constants'
import { generateTreatmentPlan } from '../lib/claude'

// ─── Vaccine Plan Builder ────────────────────────────────────────────────────

function VaccineLineItem({ item, onToggle }) {
  return (
    <div
      onClick={() => onToggle(item.id)}
      className={`flex items-start gap-3 p-3 rounded-card border cursor-pointer transition-colors select-none ${
        item.selected ? 'border-primary/30 bg-primary/5' : 'border-border bg-white opacity-60'
      }`}
    >
      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors ${
        item.selected ? 'bg-primary border-primary' : 'border-border'
      }`}>
        {item.selected && <CheckCircle className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-textPrimary">{item.name}</span>
          {item.doseNumber && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Dose {item.doseNumber}
            </span>
          )}
          {item.recommended && (
            <span className="text-xs bg-success/10 text-green-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
          )}
        </div>
        <p className="text-xs text-textMuted mt-0.5">{item.scheduledDate}</p>
        {item.note && <p className="text-xs text-textSecondary mt-1 italic">{item.note}</p>}
      </div>
      <span className="font-mono font-semibold text-sm text-textPrimary flex-shrink-0">${item.price}</span>
    </div>
  )
}

function PuppyPlanSection({ puppyName, vaccinePlan, toggleVaccineItem, aiAssessment, isLoading, error }) {
  const selectedCount = vaccinePlan.filter((v) => v.selected).length
  return (
    <div className="border border-border rounded-card-lg overflow-hidden">
      <div className="bg-bg px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐕</span>
          <span className="font-semibold text-textPrimary">{puppyName}</span>
        </div>
        {!isLoading && (
          <span className="text-xs text-textMuted">{selectedCount} vaccine{selectedCount !== 1 ? 's' : ''} selected</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-3 py-4 text-textMuted text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Designing {puppyName}'s personalised vaccination plan…
          </div>
        ) : (
          <>
            {error && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-card p-2 mb-2">{error}</p>
            )}
            {aiAssessment?.vet_notes && (
              <div className="bg-blue-50 border border-blue-100 rounded-card p-3 mb-2 flex gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">{aiAssessment.vet_notes}</p>
              </div>
            )}
            {vaccinePlan.map((item) => (
              <VaccineLineItem key={item.id} item={item} onToggle={toggleVaccineItem} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Delivery method ─────────────────────────────────────────────────────────

function DeliveryBlock({ assistSelected, setAssistSelected }) {
  return (
    <div className="space-y-3">
      {/* In-home vaccinator (default) */}
      <div
        onClick={() => setAssistSelected(true)}
        className={`rounded-card-lg border-2 p-4 cursor-pointer transition-all ${
          assistSelected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
            assistSelected ? 'border-primary' : 'border-border'
          }`}>
            {assistSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-textPrimary">VetPac Assist — in-home vaccinator</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Recommended</span>
            </div>
            <p className="text-sm text-textSecondary mt-1">
              A trained VetPac technician visits your home and administers the vaccine for you. No cold-chain handling, no guesswork — completely hands-off.
            </p>
            <p className="text-xs text-textMuted mt-1.5">${ADDONS.ASSIST.price} per visit · {ADDONS.ASSIST.note}</p>
          </div>
        </div>
      </div>

      {/* Self-administer */}
      <div
        onClick={() => setAssistSelected(false)}
        className={`rounded-card-lg border-2 p-4 cursor-pointer transition-all ${
          !assistSelected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
            !assistSelected ? 'border-primary' : 'border-border'
          }`}>
            {!assistSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-textPrimary">I'll administer at home</span>
            <p className="text-sm text-textSecondary mt-1">
              Vaccines are cold-chain couriered to your door. Step-by-step guidance included. Our 24/7 line is with you the whole way.
            </p>
            <p className="text-xs text-textMuted mt-1.5">${FREIGHT.pricePerShipment} per shipment · pharmaceutical-grade 2–8°C courier</p>
          </div>
        </div>

        {/* Free scales offer */}
        {!assistSelected && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-card flex items-start gap-2.5">
            <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Free VetPac Digital Scales included</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Precision puppy scales (normally ${SCALES.retailPrice}) included free with your first order. Monitor weight at every dose — ensures correct dosing every time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Insurance block ─────────────────────────────────────────────────────────

function InsuranceBlock({ insuranceSelected, setInsuranceSelected, insuranceBilling, setInsuranceBilling }) {
  const plans = [
    {
      id: 'monthly',
      label: 'Monthly',
      price: `$${INSURANCE.monthlyPrice}/mo`,
      subtext: 'Pay month to month',
      excess: INSURANCE.excess,
      badge: null,
    },
    {
      id: 'annual',
      label: 'Annual',
      price: `$${INSURANCE.annualPrice}/yr`,
      subtext: `$${(INSURANCE.annualPrice / 12).toFixed(2)}/month`,
      excess: INSURANCE.excess,
      badge: 'Save vs monthly',
    },
    {
      id: 'twoYear',
      label: '2-Year',
      price: `$${INSURANCE.twoYearPrice}`,
      subtext: `$${(INSURANCE.twoYearPrice / 24).toFixed(2)}/month · pay once`,
      excess: INSURANCE.twoYearExcess,
      badge: 'Best value · excess halved',
    },
  ]

  return (
    <div className="border-2 border-border rounded-card-lg p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Heart className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-textPrimary">{INSURANCE.name}</h3>
          <p className="text-sm text-textSecondary mt-1">
            The first two years of a puppy's life carry the highest health risk — and the highest vet bills. One unexpected illness or injury can cost thousands. VetPac Cover is here for exactly those moments.
          </p>
        </div>
      </div>

      {/* Key benefits */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Cover limit', value: `$${(INSURANCE.coverLimit / 1000).toFixed(0)}k` },
          { label: 'Reimbursement', value: `${INSURANCE.reimbursement}%` },
          { label: 'Waiting period', value: '14 days' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bg rounded-card border border-border p-2">
            <p className="text-base font-bold text-primary">{value}</p>
            <p className="text-xs text-textMuted">{label}</p>
          </div>
        ))}
      </div>

      {/* Billing plan selector */}
      <div className="space-y-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => { setInsuranceSelected(true); setInsuranceBilling(plan.id) }}
            className={`rounded-card border-2 p-3 cursor-pointer transition-all ${
              insuranceSelected && insuranceBilling === plan.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-white hover:border-primary/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                insuranceSelected && insuranceBilling === plan.id ? 'border-primary' : 'border-border'
              }`}>
                {insuranceSelected && insuranceBilling === plan.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-textPrimary">{plan.label}</span>
                  {plan.badge && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">{plan.badge}</span>
                  )}
                </div>
                <p className="text-xs text-textMuted mt-0.5">{plan.subtext} · ${plan.excess} excess</p>
              </div>
              <span className="font-mono font-bold text-textPrimary flex-shrink-0">{plan.price}</span>
            </div>
          </div>
        ))}

        <button
          onClick={() => setInsuranceSelected(false)}
          className={`w-full text-left rounded-card border-2 p-3 transition-all ${
            !insuranceSelected ? 'border-primary/30 bg-primary/5' : 'border-border bg-white hover:border-border/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              !insuranceSelected ? 'border-primary' : 'border-border'
            }`}>
              {!insuranceSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span className="text-sm text-textSecondary">No cover thanks</span>
          </div>
        </button>
      </div>

      {insuranceSelected && (
        <p className="text-xs text-textMuted">
          Cover provided by Forman Pacific LLC. By adding cover you agree to the{' '}
          <Link to="/insurance-terms" className="text-primary underline">VetPac Cover terms</Link>.
          ${insuranceBilling === 'twoYear' ? INSURANCE.twoYearExcess : INSURANCE.excess} excess per claim · {INSURANCE.reimbursement}% reimbursement.
        </p>
      )}
    </div>
  )
}

// ─── Order summary ────────────────────────────────────────────────────────────

function OrderSummary({ totals, puppyCount }) {
  return (
    <div className="bg-bg border border-border rounded-card-lg p-4 space-y-2">
      <p className="text-sm font-semibold text-textPrimary mb-3">Order summary</p>
      {totals.vaccines > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Vaccines{puppyCount > 1 ? ` (${puppyCount} puppies)` : ''}</span>
          <span className="font-mono font-semibold">NZD ${totals.vaccines}</span>
        </div>
      )}
      {totals.assist > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">VetPac Assist ({totals.doseCount} visit{totals.doseCount !== 1 ? 's' : ''})</span>
          <span className="font-mono font-semibold">NZD ${totals.assist}</span>
        </div>
      )}
      {totals.freight > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Cold-chain freight ({totals.shipmentCount} shipment{totals.shipmentCount !== 1 ? 's' : ''})</span>
          <span className="font-mono font-semibold">NZD ${totals.freight}</span>
        </div>
      )}
      {totals.insurance > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">
            VetPac Cover ({totals.insuranceBilling === 'twoYear' ? '2yr upfront' : totals.insuranceBilling})
          </span>
          <span className="font-mono font-semibold">NZD ${totals.insurance.toFixed(2)}</span>
        </div>
      )}
      <div className="border-t border-border pt-2 flex justify-between items-center">
        <span className="font-semibold text-textPrimary text-sm">Total due today</span>
        <span className="font-mono font-bold text-accent text-lg">NZD ${(totals.vaccines + totals.assist + totals.freight + totals.insurance).toFixed(2)}</span>
      </div>
      <p className="text-xs text-textMuted">Consultation fee of ${totals.consultation} already paid.</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    dogProfile, healthHistory, lifestyle, ownerDetails, additionalPuppies,
    aiAssessment, setAiAssessment,
    numberOfPuppies,
    vaccinePlan, toggleVaccineItem,
    assistSelected, setAssistSelected,
    insuranceSelected, setInsuranceSelected,
    insuranceBilling, setInsuranceBilling,
    consultPaid, setConsultPaid,
    getOrderTotals,
  } = useIntakeStore()

  const [aiLoading, setAiLoading] = useState(!aiAssessment)
  const [aiError, setAiError] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Mark consult as paid when returning from Stripe
  useEffect(() => {
    if (searchParams.get('paid') === '1') {
      setConsultPaid(true)
    }
  }, [])

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
      setAiError('Plan generated using standard protocol — a vet will review before anything is confirmed.')
      setAiAssessment(null)
    } finally {
      setAiLoading(false)
    }
  }

  const totals = getOrderTotals()
  const selectedVaccines = vaccinePlan.filter((v) => v.selected)
  const puppyName = dogProfile.name || 'your puppy'

  const handleConfirmPlan = () => {
    if (selectedVaccines.length === 0) return
    setCheckoutLoading(true)
    const items = selectedVaccines.map((v) => ({ name: v.name, price: v.price }))
    const vaccineOnly = totals.vaccines + totals.assist + totals.freight + totals.insurance

    const params = new URLSearchParams({
      mode: 'vaccines',
      puppy: puppyName,
      puppyCount: numberOfPuppies.toString(),
      total: vaccineOnly.toFixed(2),
      consult: '0',
      vaccines: totals.vaccines.toString(),
      freight: totals.freight.toString(),
      assist: totals.assist.toString(),
      insurance: totals.insurance.toFixed(2),
      insuranceBilling: totals.insuranceBilling,
      items: encodeURIComponent(JSON.stringify(items)),
    })
    navigate(`/checkout?${params.toString()}`)
    setCheckoutLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Minimal header */}
      <div className="border-b border-border bg-white px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-lg text-primary">VetPac</Link>
        <span className="text-xs text-textMuted">Your vaccination plan</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 bg-success/10 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-success/20">
            <CheckCircle className="w-3.5 h-3.5" /> Consultation confirmed — your plan is ready
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">
            {numberOfPuppies > 1 ? 'Your puppies\' vaccination plan' : `${puppyName}'s vaccination plan`}
          </h1>
          <p className="text-textSecondary">
            Review the recommended vaccines, choose how they're administered, and confirm.
          </p>
        </div>

        {/* Vaccine plan — one section per puppy */}
        <div className="space-y-4">
          <h2 className="font-semibold text-textPrimary">
            Recommended vaccines
          </h2>

          {/* Primary puppy */}
          <PuppyPlanSection
            puppyName={puppyName}
            vaccinePlan={vaccinePlan}
            toggleVaccineItem={toggleVaccineItem}
            aiAssessment={aiAssessment}
            isLoading={aiLoading}
            error={aiError}
          />

          {/* Additional puppies — use same plan structure, separate pricing */}
          {additionalPuppies.map((puppy, i) => {
            const extraName = puppy.name || `Puppy ${i + 2}`
            const extraPlan = buildVaccinePlan(aiAssessment, { ...dogProfile, ...puppy })
            return (
              <PuppyPlanSection
                key={i}
                puppyName={extraName}
                vaccinePlan={extraPlan}
                toggleVaccineItem={() => {}}
                aiAssessment={aiAssessment}
                isLoading={aiLoading}
                error={null}
              />
            )
          })}

          {aiLoading && (
            <Alert type="info">Building your plan — this takes about 15 seconds.</Alert>
          )}
        </div>

        {/* Step 2: Delivery */}
        <div>
          <h2 className="font-semibold text-textPrimary mb-3">How would you like it done?</h2>
          <DeliveryBlock assistSelected={assistSelected} setAssistSelected={setAssistSelected} />
        </div>

        {/* Step 3: Insurance */}
        <div>
          <h2 className="font-semibold text-textPrimary mb-3">Protect the next two years</h2>
          <InsuranceBlock
            insuranceSelected={insuranceSelected}
            setInsuranceSelected={setInsuranceSelected}
            insuranceBilling={insuranceBilling}
            setInsuranceBilling={setInsuranceBilling}
          />
        </div>

        {/* Order summary */}
        <OrderSummary totals={totals} puppyCount={numberOfPuppies} />

        {/* CTA */}
        {selectedVaccines.length === 0 && (
          <Alert type="warning">Select at least one vaccine to continue.</Alert>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handleConfirmPlan}
          loading={checkoutLoading}
          disabled={selectedVaccines.length === 0 || aiLoading}
        >
          Confirm plan — Pay NZD ${(totals.vaccines + totals.assist + totals.freight + totals.insurance).toFixed(2)} →
        </Button>

        <div className="flex items-center justify-center gap-4 text-xs text-textMuted">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secured by Stripe</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> NZD · no conversion</span>
        </div>
      </div>
    </div>
  )
}
