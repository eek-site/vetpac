import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  CheckCircle, Lock, Loader2, ChevronDown, ChevronUp,
  Shield, Heart, Star, AlertCircle, Tag, Syringe, Home, Truck, Phone,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Modal from '../components/ui/Modal'
import FloatingChat from '../components/FloatingChat'
import { useIntakeStore, buildVaccinePlan } from '../store/intakeStore'
import { FREIGHT, ADDONS, SCALES, INSURANCE, calculateConsultFee, REGIONAL_CONSULTATION_FEES } from '../lib/constants'
import { generateTreatmentPlan } from '../lib/claude'

// ─── Helpers ────────────────────────────────────────────────────────────────

function SectionLabel({ number, label, sub }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{number}</div>
      <div>
        <h2 className="font-display font-bold text-lg text-textPrimary">{label}</h2>
        {sub && <p className="text-sm text-textMuted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function Accordion({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between gap-3 py-4 text-left">
        <span className="text-sm font-semibold text-textPrimary pr-2">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-textMuted flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-textMuted flex-shrink-0 mt-0.5" />}
      </button>
      {open && <p className="text-sm text-textSecondary leading-relaxed pb-4">{a}</p>}
    </div>
  )
}

// ─── Vaccine plan ────────────────────────────────────────────────────────────

function VaccineLineItem({ item, onToggle }) {
  return (
    <div onClick={() => onToggle(item.id)} className={`flex items-start gap-3 p-3 rounded-card border cursor-pointer transition-colors select-none ${item.selected ? 'border-primary/30 bg-primary/5' : 'border-border bg-white opacity-60'}`}>
      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors ${item.selected ? 'bg-primary border-primary' : 'border-border'}`}>
        {item.selected && <CheckCircle className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-textPrimary">{item.name}</span>
          {item.doseNumber && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Dose {item.doseNumber}</span>}
          {item.recommended && <span className="text-xs bg-success/10 text-green-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>}
        </div>
        <p className="text-xs text-textMuted mt-0.5">{item.scheduledDate}</p>
        {item.note && <p className="text-xs text-textSecondary mt-1 italic">{item.note}</p>}
      </div>
      <span className="font-mono font-semibold text-sm flex-shrink-0">${item.price}</span>
    </div>
  )
}

function PuppyPlanSection({ puppyName, vaccinePlan, toggleVaccineItem, aiAssessment, isLoading }) {
  return (
    <div className="border border-border rounded-card-lg overflow-hidden">
      <div className="bg-bg px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐕</span>
          <span className="font-semibold text-textPrimary text-sm">{puppyName}</span>
        </div>
        {!isLoading && <span className="text-xs text-textMuted">{vaccinePlan.filter((v) => v.selected).length} vaccines selected</span>}
      </div>
      <div className="p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-3 py-4 text-sm text-textMuted">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Designing {puppyName}'s plan…
          </div>
        ) : (
          vaccinePlan.map((item) => <VaccineLineItem key={item.id} item={item} onToggle={toggleVaccineItem} />)
        )}
      </div>
    </div>
  )
}

// ─── Delivery ────────────────────────────────────────────────────────────────

function DeliveryBlock({ assistSelected, setAssistSelected }) {
  return (
    <div className="space-y-3">
      <div onClick={() => setAssistSelected(false)} className={`rounded-card-lg border-2 p-4 cursor-pointer transition-all ${!assistSelected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${!assistSelected ? 'border-primary' : 'border-border'}`}>
            {!assistSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-textPrimary text-sm">I'll administer at home</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Most popular</span>
            </div>
            <p className="text-sm text-textSecondary mt-1">Vaccines cold-chain couriered to your door. Step-by-step guide included. 24/7 support line with you throughout.</p>
            <p className="text-xs text-textMuted mt-1.5">${FREIGHT.pricePerShipment} per shipment · 2–8°C certified pharmaceutical courier</p>
          </div>
        </div>
        {!assistSelected && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-card flex items-start gap-2">
            <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Free VetPac Digital Scales included</p>
              <p className="text-xs text-amber-700 mt-0.5">Precision puppy scales (normally ${SCALES.retailPrice}) — free with your first order. Monitor weight at every dose for correct dosing.</p>
            </div>
          </div>
        )}
      </div>

      <div onClick={() => setAssistSelected(true)} className={`rounded-card-lg border-2 p-4 cursor-pointer transition-all ${assistSelected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${assistSelected ? 'border-primary' : 'border-border'}`}>
            {assistSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-textPrimary text-sm">VetPac Assist — in-home vaccinator</span>
            <p className="text-sm text-textSecondary mt-1">A trained VetPac technician visits your home and administers the vaccine for you. Completely hands-off.</p>
            <p className="text-xs text-textMuted mt-1.5">${ADDONS.ASSIST.price} per visit · {ADDONS.ASSIST.note}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Order summary ────────────────────────────────────────────────────────────

function OrderSummary({ totals, puppyCount, discountApplied }) {
  const vaccineAndDelivery = totals.vaccines + totals.assist + totals.freight
  const displayTotal = discountApplied ? 1.00 : vaccineAndDelivery
  return (
    <div className="bg-bg border border-border rounded-card-lg p-4 space-y-2">
      <p className="text-sm font-semibold text-textPrimary mb-3">Vaccine order total</p>
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
          <span className="text-textSecondary">Cold-chain freight</span>
          <span className="font-mono font-semibold">NZD ${totals.freight}</span>
        </div>
      )}
      <div className="border-t border-border pt-2 flex justify-between items-center">
        <span className="font-semibold text-textPrimary text-sm">Total due today</span>
        <span className="font-mono font-bold text-accent text-base">NZD ${displayTotal.toFixed(2)}</span>
      </div>
      {discountApplied && <p className="text-xs text-green-700 font-medium">BOSSMODE applied — $1.00 test charge</p>}
      <p className="text-xs text-textMuted">Consultation fee already paid. Insurance billed separately if added.</p>
    </div>
  )
}

// ─── Insurance section ───────────────────────────────────────────────────────

const INSURANCE_FAQ = [
  { q: 'What does VetPac Cover actually cover?', a: 'Accidents and illness including surgery, hospitalisation, specialist consultations, diagnostics (X-rays, ultrasounds, blood tests), emergency treatment, and prescription medications. We cover what matters most in the first two years.' },
  { q: 'What is not covered?', a: 'Pre-existing conditions, routine preventive care (including the vaccinations you are purchasing now), elective procedures, dental disease, and breeding-related costs. Full exclusions are listed in the policy document.' },
  { q: 'Why choose the 2-year plan?', a: 'The first two years of a puppy\'s life carry the highest risk of unexpected illness and injury. Locking in 2 years at once means your excess drops from $1,500 to $750, your rate is guaranteed for the full term, and you never have to think about renewal during the most vulnerable period.' },
  { q: 'How do I make a claim?', a: 'Email your vet invoice to claims@vetpac.nz with your policy number. We process 80% of claims within 5 business days. We reimburse 80% of eligible costs above your excess directly to your nominated bank account.' },
  { q: 'Is there a waiting period?', a: 'Yes — 14 days from the date cover commences for illness claims. Accidents are covered from day one. This is standard across all pet insurance policies in NZ.' },
  { q: 'Can I cancel?', a: 'Monthly cover can be cancelled any time with no penalty. Annual and 2-year plans can be cancelled within 14 days of purchase for a full refund. After 14 days, the remaining premium is non-refundable but cover remains active for the paid period.' },
]

const INSURANCE_TERMS_CONTENT = (
  <div className="space-y-4 text-sm leading-relaxed">
    <p className="font-semibold text-textPrimary">VetPac 2-Year Puppy Cover — Policy Summary</p>
    <p>Issued by Forman Pacific LLC. This is a summary. The full policy document is available on request.</p>
    <div className="space-y-3">
      {[
        { t: 'Cover limit', b: 'NZD $15,000 per policy period.' },
        { t: 'Reimbursement', b: '80% of eligible costs above the excess.' },
        { t: 'Excess', b: '$1,500 per claim (monthly/annual). $750 per claim (2-year upfront plan).' },
        { t: 'Waiting period', b: '14 days for illness. Zero days for accidents.' },
        { t: 'What is covered', b: 'Accidents, illness, surgery, hospitalisation, specialist consultations, diagnostics, emergency treatment, prescription medications.' },
        { t: 'What is not covered', b: 'Pre-existing conditions, preventive care, elective procedures, dental disease, breeding costs, behavioural treatment.' },
        { t: 'Claims', b: 'Email claims@vetpac.nz with vet invoice and policy number. 80% of claims processed within 5 business days.' },
        { t: 'Billing', b: 'Monthly ($24.99/mo), Annual ($259/yr), or 2-Year upfront ($489). 2-year rate is guaranteed for the full term.' },
        { t: 'Cancellation', b: 'Monthly: cancel any time. Annual/2-year: full refund within 14 days of purchase; no refund after 14 days.' },
        { t: 'Renewal', b: '2-year plans do not auto-renew. Monthly and annual plans auto-renew unless cancelled.' },
        { t: 'Governing law', b: 'New Zealand. Disputes resolved under the Insurance (Prudential Supervision) Act 2010.' },
      ].map(({ t, b }) => (
        <div key={t}>
          <p className="font-semibold text-textPrimary">{t}</p>
          <p className="text-textSecondary mt-0.5">{b}</p>
        </div>
      ))}
    </div>
  </div>
)

function InsuranceSection({ insuranceSelected, setInsuranceSelected, insuranceBilling, setInsuranceBilling }) {
  const [termsOpen, setTermsOpen] = useState(false)
  const plans = [
    { id: 'monthly', label: 'Monthly', price: `$${INSURANCE.monthlyPrice}/mo`, sub: 'Pay month to month', excess: INSURANCE.excess, badge: null },
    { id: 'annual', label: 'Annual', price: `$${INSURANCE.annualPrice}/yr`, sub: `$${(INSURANCE.annualPrice / 12).toFixed(2)}/month`, excess: INSURANCE.excess, badge: 'Save vs monthly' },
    { id: 'twoYear', label: '2-Year upfront', price: `$${INSURANCE.twoYearPrice}`, sub: `$${(INSURANCE.twoYearPrice / 24).toFixed(2)}/month · pay once`, excess: INSURANCE.twoYearExcess, badge: 'Best value · excess halved to $750' },
  ]

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-card-lg">
          <Heart className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-textPrimary text-sm">{INSURANCE.name}</p>
            <p className="text-sm text-textSecondary mt-1">The first two years of a puppy's life are the most unpredictable. One unexpected illness or surgery can cost $3,000–$8,000. VetPac Cover is designed for exactly this window.</p>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: `$${(INSURANCE.coverLimit / 1000).toFixed(0)}k`, l: 'Cover limit' },
            { v: `${INSURANCE.reimbursement}%`, l: 'Reimbursement' },
            { v: '14 days', l: 'Waiting period' },
          ].map(({ v, l }) => (
            <div key={l} className="bg-bg border border-border rounded-card p-2.5 text-center">
              <p className="text-base font-bold text-primary">{v}</p>
              <p className="text-xs text-textMuted">{l}</p>
            </div>
          ))}
        </div>

        {/* Plan options */}
        <div className="space-y-2">
          {plans.map((plan) => (
            <div key={plan.id} onClick={() => { setInsuranceSelected(true); setInsuranceBilling(plan.id) }}
              className={`rounded-card border-2 p-3 cursor-pointer transition-all ${insuranceSelected && insuranceBilling === plan.id ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${insuranceSelected && insuranceBilling === plan.id ? 'border-primary' : 'border-border'}`}>
                  {insuranceSelected && insuranceBilling === plan.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-textPrimary">{plan.label}</span>
                    {plan.badge && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">{plan.badge}</span>}
                  </div>
                  <p className="text-xs text-textMuted mt-0.5">{plan.sub} · ${plan.excess} excess</p>
                </div>
                <span className="font-mono font-bold text-sm text-textPrimary flex-shrink-0">{plan.price}</span>
              </div>
            </div>
          ))}
          <button onClick={() => setInsuranceSelected(false)}
            className={`w-full text-left rounded-card border-2 p-3 transition-all ${!insuranceSelected ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${!insuranceSelected ? 'border-primary' : 'border-border'}`}>
                {!insuranceSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm text-textSecondary">No cover for now</span>
            </div>
          </button>
        </div>

        {insuranceSelected && (
          <p className="text-xs text-textMuted">
            By adding cover you agree to the{' '}
            <button onClick={() => setTermsOpen(true)} className="text-primary underline font-medium">VetPac Cover terms</button>.
            ${insuranceBilling === 'twoYear' ? INSURANCE.twoYearExcess : INSURANCE.excess} excess per claim · {INSURANCE.reimbursement}% reimbursement · cover provided by Forman Pacific LLC.
          </p>
        )}

        {/* Insurance FAQ */}
        <div className="border border-border rounded-card-lg overflow-hidden">
          <div className="px-4 py-3 bg-bg border-b border-border">
            <p className="font-semibold text-sm text-textPrimary">Cover questions</p>
          </div>
          <div className="px-4 divide-y divide-border">
            {INSURANCE_FAQ.map((item) => <Accordion key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </div>

      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="VetPac Cover — Policy Terms">
        {INSURANCE_TERMS_CONTENT}
      </Modal>
    </>
  )
}

// ─── Plan FAQ ────────────────────────────────────────────────────────────────

const PLAN_FAQ = [
  { q: 'How hard is it to administer at home?', a: 'Very straightforward. The needle is small (25 gauge), the injection is subcutaneous (just under the skin at the scruff of the neck), and the whole process takes less than two minutes. Most owners are surprised by how easy it is. Our step-by-step guide walks you through every single action, and our 0800 line is staffed 24/7 if you want someone on the phone while you do it.' },
  { q: "What if I'm nervous about injecting?", a: 'That is completely normal and we hear it from most first-timers. The guide is written for people with zero medical experience. The technique is simple, the needle causes minimal discomfort, and puppies generally tolerate it very well at home — especially compared to the stress of a clinic visit. If you try it and genuinely cannot do it, call us and we will arrange a VetPac Assist visit.' },
  { q: 'What equipment do I need?', a: 'Nothing. Everything arrives in the kit — the vaccine vial, syringe, needle, swabs, and a step-by-step instruction card. If you choose self-administration, we also include a free set of VetPac digital scales (normally $49) so you can monitor your puppy\'s weight at every dose.' },
  { q: 'What is the difference between self-administration and VetPac Assist?', a: 'With self-administration, we ship the vaccines cold-chain to your door and you administer them at home with our full guidance. It costs less and gives you complete flexibility over timing. VetPac Assist sends a trained technician to your home — completely hands-off for you. Both result in exactly the same outcome for your puppy.' },
  { q: 'How does the cold-chain work?', a: 'Every shipment is packed in pharmaceutical-grade insulated packaging with a certified gel ice pack rated to hold 2–8°C for a minimum of 48 hours. A colour-change temperature indicator strip is included. If it shows green on arrival, the cold chain held. If it has changed colour, contact us immediately — we will resend at no charge.' },
  { q: 'What do I do before administering the vaccine?', a: 'Run through the pre-vaccination checklist included in your kit. Your puppy should be alert, eating normally, showing no signs of illness (runny nose, lethargy, discharge, unusual behaviour), and not have eaten in the last two hours. If anything flags, stop and call us — never proceed with a vaccine if your puppy is unwell.' },
  { q: 'What happens after vaccination?', a: 'Monitor your puppy for 30 minutes. Mild lethargy or a small bump at the injection site is normal and resolves within 24 hours. If you see facial swelling, hives, vomiting, or collapse, call the 0800 VETPAC emergency line immediately. Serious reactions are very rare but we take them seriously and will guide you through exactly what to do.' },
  { q: 'Will the certificate be accepted by my vet, groomer, or boarding facility?', a: 'Yes. Every completed programme generates a signed vaccination certificate confirming the products used, the dates administered, and the authorising veterinarian. It is accepted by boarding facilities, groomers, dog parks, and other vets across New Zealand.' },
  { q: 'Is it legal to administer vaccines at home in New Zealand?', a: 'Yes. VetPac operates under the ACVM Act 1997 VOI (Veterinary Operating Instruction) framework. Every vaccination plan is reviewed and authorised by a NZ-registered veterinarian before anything is dispatched. The VOI is the legal mechanism that permits administration of prescription veterinary medicines by a lay person under veterinary supervision.' },
]

// ─── Trust elements ──────────────────────────────────────────────────────────

function TrustSection() {
  return (
    <div className="space-y-3">
      {[
        { icon: Shield, title: 'Every plan is vet-authorised', body: 'A NZ-registered veterinarian reviews and signs off every vaccination plan before anything is confirmed. Your puppy\'s programme is clinically reviewed — not just generated by an algorithm.' },
        { icon: Syringe, title: 'Pharmaceutical-grade vaccines', body: 'We supply only ACVM-registered, cold-chain maintained vaccines from licensed distributors. Every vial is sealed, sterile, and single-use. We do not use compounded or grey-market products.' },
        { icon: Home, title: 'Your home is safer than a waiting room', body: 'Clinic waiting rooms concentrate unvaccinated animals. Your home has none of those pathogens. For puppies with incomplete immunity, your living room is genuinely the safest place to complete their vaccination course.' },
        { icon: Truck, title: 'Cold-chain guaranteed', body: 'Every shipment includes a pharmaceutical-grade insulated pack and a temperature indicator strip. If the cold chain breaks at any point, the indicator changes colour and we resend immediately at no cost.' },
        { icon: Phone, title: '24/7 support throughout', body: 'The 0800 VETPAC line is staffed around the clock. Call before, during, or after vaccination — we stay with you. No voicemail, no ticket system. A person answers.' },
      ].map(({ icon: Icon, title, body }) => (
        <div key={title} className="flex gap-3 p-4 bg-white border border-border rounded-card-lg">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-textPrimary">{title}</p>
            <p className="text-sm text-textSecondary mt-0.5 leading-relaxed">{body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

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
    setConsultPaid,
    getOrderTotals,
  } = useIntakeStore()

  const [aiLoading, setAiLoading] = useState(!aiAssessment)
  const [aiError, setAiError] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountError, setDiscountError] = useState(null)

  useEffect(() => {
    if (searchParams.get('paid') === '1') setConsultPaid(true)
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
      setAiError('Plan built using standard protocol — a vet will review before anything is confirmed.')
      setAiAssessment(null)
    } finally {
      setAiLoading(false)
    }
  }

  const applyDiscount = () => {
    if (discountInput.trim().toLowerCase() === 'bossmode') {
      setDiscountCode(discountInput.trim())
      setDiscountApplied(true)
      setDiscountError(null)
    } else {
      setDiscountError('Invalid code.')
    }
  }

  const totals = getOrderTotals()
  const selectedVaccines = vaccinePlan.filter((v) => v.selected)
  const puppyName = dogProfile.name || 'your puppy'
  const vaccineAndDelivery = totals.vaccines + totals.assist + totals.freight
  const displayVaccineTotal = discountApplied ? 1.00 : vaccineAndDelivery

  const handleConfirmPlan = () => {
    if (selectedVaccines.length === 0) return
    setCheckoutLoading(true)
    const items = selectedVaccines.map((v) => ({ name: v.name, price: v.price }))

    const params = new URLSearchParams({
      mode: 'vaccines',
      puppy: puppyName,
      puppyCount: numberOfPuppies.toString(),
      total: displayVaccineTotal.toFixed(2),
      consult: '0',
      vaccines: discountApplied ? '1' : totals.vaccines.toString(),
      freight: discountApplied ? '0' : totals.freight.toString(),
      assist: discountApplied ? '0' : totals.assist.toString(),
      insurance: totals.insurance.toFixed(2),
      insuranceBilling: totals.insuranceBilling,
      items: encodeURIComponent(JSON.stringify(discountApplied ? [{ name: 'Vaccines (bossmode)', price: 1 }] : items)),
      ...(discountApplied ? { discountCode: discountCode } : {}),
    })
    navigate(`/checkout?${params.toString()}`)
    setCheckoutLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="border-b border-border bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-20">
        <Link to="/" className="font-display font-bold text-lg text-primary">VetPac</Link>
        <span className="text-xs text-textMuted">Your vaccination plan</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">

        {/* Confirmed banner */}
        <div className="inline-flex items-center gap-2 bg-success/10 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-success/20">
          <CheckCircle className="w-3.5 h-3.5" /> Consultation confirmed — your plan is ready
        </div>

        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary mb-1">
            {numberOfPuppies > 1 ? 'Your puppies\' vaccination plan' : `${puppyName}'s vaccination plan`}
          </h1>
          <p className="text-textSecondary text-sm">Select your vaccines, choose how they're administered, and confirm.</p>
        </div>

        {/* ── STEP 1: Vaccines ── */}
        <section>
          <SectionLabel number="1" label="Recommended vaccines" sub="Reviewed and authorised by a NZ-registered veterinarian" />
          {aiError && <Alert type="warning" className="mb-3">{aiError}</Alert>}
          <PuppyPlanSection
            puppyName={puppyName}
            vaccinePlan={vaccinePlan}
            toggleVaccineItem={toggleVaccineItem}
            aiAssessment={aiAssessment}
            isLoading={aiLoading}
          />
          {additionalPuppies.map((puppy, i) => (
            <PuppyPlanSection
              key={i}
              puppyName={puppy.name || `Puppy ${i + 2}`}
              vaccinePlan={buildVaccinePlan(aiAssessment, { ...dogProfile, ...puppy })}
              toggleVaccineItem={() => {}}
              aiAssessment={aiAssessment}
              isLoading={aiLoading}
            />
          ))}
        </section>

        {/* ── STEP 2: Delivery ── */}
        <section>
          <SectionLabel number="2" label="How would you like it done?" sub="Most customers administer at home — it takes less than two minutes." />
          <DeliveryBlock assistSelected={assistSelected} setAssistSelected={setAssistSelected} />
        </section>

        {/* ── Order summary + discount + CTA ── */}
        <section className="space-y-3">
          <OrderSummary totals={totals} puppyCount={numberOfPuppies} discountApplied={discountApplied} />

          {/* Discount code */}
          {!discountApplied ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                  placeholder="Discount code"
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                />
              </div>
              <button onClick={applyDiscount} className="px-4 py-2.5 border border-border rounded-card text-sm font-medium text-textSecondary hover:bg-bg transition-colors flex-shrink-0">Apply</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-card text-sm text-green-800">
              <CheckCircle className="w-4 h-4" /> Code <strong className="mx-1">{discountCode.toUpperCase()}</strong> applied — NZD $1.00
            </div>
          )}
          {discountError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {discountError}</p>}

          {selectedVaccines.length === 0 && <Alert type="warning">Select at least one vaccine to continue.</Alert>}

          <Button fullWidth size="lg" onClick={handleConfirmPlan} loading={checkoutLoading} disabled={selectedVaccines.length === 0 || aiLoading}>
            Confirm vaccines — Pay NZD ${displayVaccineTotal.toFixed(2)} →
          </Button>
          <p className="text-xs text-center text-textMuted flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Secured by Stripe · NZD · no currency conversion
          </p>
        </section>

        {/* ── SECTION 2: Insurance ── */}
        <section className="border-t-4 border-primary/10 pt-8">
          <SectionLabel number="3" label="Protect the next two years" sub={`The most important health window of ${puppyName}'s life.`} />
          <InsuranceSection
            insuranceSelected={insuranceSelected}
            setInsuranceSelected={setInsuranceSelected}
            insuranceBilling={insuranceBilling}
            setInsuranceBilling={setInsuranceBilling}
          />
          {insuranceSelected && (
            <div className="mt-4 p-4 bg-bg border border-border rounded-card-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-textSecondary">
                  {INSURANCE.name} ({insuranceBilling === 'twoYear' ? '2-year upfront' : insuranceBilling})
                </span>
                <span className="font-mono font-semibold">
                  ${insuranceBilling === 'twoYear' ? INSURANCE.twoYearPrice : insuranceBilling === 'annual' ? INSURANCE.annualPrice : `${INSURANCE.monthlyPrice}/mo`}
                </span>
              </div>
              <p className="text-xs text-textMuted">Insurance is billed separately and is not included in the vaccine payment above. You will receive a separate invoice once your plan is confirmed.</p>
            </div>
          )}
        </section>

        {/* ── FAQ ── */}
        <section className="border-t-4 border-primary/10 pt-8">
          <SectionLabel number="4" label="Everything you need to know" sub="Comprehensive answers before you confirm." />
          <div className="border border-border rounded-card-lg overflow-hidden px-4 divide-y divide-border">
            {PLAN_FAQ.map((item) => <Accordion key={item.q} q={item.q} a={item.a} />)}
          </div>
        </section>

        {/* ── Trust ── */}
        <section className="border-t-4 border-primary/10 pt-8">
          <SectionLabel number="5" label="Why you can trust this" />
          <TrustSection />
        </section>

      </div>

      {/* Floating chat */}
      <FloatingChat />
    </div>
  )
}
