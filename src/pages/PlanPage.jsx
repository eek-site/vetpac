import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  CheckCircle, Lock, Loader2, ChevronDown, ChevronUp,
  Shield, Heart, Star, AlertCircle, Tag, Syringe, Home, Truck, MessageCircle, ArrowLeft,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Modal from '../components/ui/Modal'
import FloatingChat from '../components/FloatingChat'
import { useIntakeStore, buildVaccinePlan } from '../store/intakeStore'
import { FREIGHT, ADDONS, SCALES, INSURANCE } from '../lib/constants'
import { generateTreatmentPlan } from '../lib/claude'

// ─── Step progress bar ───────────────────────────────────────────────────────

const STEPS = ['Your plan', 'Delivery', 'Cover', 'Confirm']

function StepBar({ step }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((label, i) => {
        const idx = i + 1
        const done = idx < step
        const active = idx === step
        return (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {i > 0 && <div className={`h-0.5 flex-1 transition-colors ${done || active ? 'bg-primary' : 'bg-border'}`} />}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${done ? 'bg-primary text-white' : active ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-bg border-2 border-border text-textMuted'}`}>
                {done ? <CheckCircle className="w-3.5 h-3.5" /> : idx}
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 transition-colors ${done ? 'bg-primary' : 'bg-border'}`} />}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${active ? 'text-primary' : done ? 'text-textSecondary' : 'text-textMuted'}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Accordion ───────────────────────────────────────────────────────────────

function Accordion({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between gap-3 py-3.5 text-left">
        <span className="text-sm font-semibold text-textPrimary pr-2">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-textMuted flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-textMuted flex-shrink-0 mt-0.5" />}
      </button>
      {open && <p className="text-sm text-textSecondary leading-relaxed pb-4">{a}</p>}
    </div>
  )
}

// ─── Vaccine items ───────────────────────────────────────────────────────────

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

function PuppyPlanSection({ puppyName, vaccinePlan, toggleVaccineItem, isLoading }) {
  return (
    <div className="border border-border rounded-card-lg overflow-hidden">
      <div className="bg-bg px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-base">🐕</span>
          <span className="font-semibold text-textPrimary text-sm">{puppyName}</span>
        </div>
        {!isLoading && <span className="text-xs text-textMuted">{vaccinePlan.filter((v) => v.selected).length} selected</span>}
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

// ─── Delivery FAQs ───────────────────────────────────────────────────────────

const SELF_ADMIN_FAQ = [
  { q: 'How hard is it to administer at home?', a: 'Very straightforward. The needle is small (25 gauge), the injection is subcutaneous (just under the skin at the scruff of the neck), and the whole process takes under two minutes. Our step-by-step guide walks you through every single action, and our 24/7 WhatsApp support is there the whole time if you want someone with you as you do it.' },
  { q: "What if I'm nervous about injecting?", a: "Completely normal — most first-timers feel exactly the same. The guide is written for people with zero medical experience. Puppies generally tolerate it very well at home, especially compared to the stress of a clinic visit. If you try it and genuinely can't do it, message us on WhatsApp and we'll arrange a VetPac Assist visit." },
  { q: 'What equipment do I need?', a: 'Nothing extra. Everything arrives in the kit — the vaccine vial, syringe, needle, swabs, and a step-by-step instruction card with photos. Free VetPac digital scales are included with your first order so you can monitor weight at every dose for correct dosing.' },
  { q: 'What do I do before administering?', a: 'Run through the pre-vaccination checklist included in your kit. Your puppy should be alert, eating normally, showing no signs of illness (runny nose, lethargy, discharge, unusual behaviour), and not have eaten in the last two hours. If anything flags, stop and message us on WhatsApp — never proceed with a vaccine if your puppy is unwell.' },
  { q: 'What happens after vaccination?', a: 'Monitor your puppy for 30 minutes. Mild lethargy or a small bump at the injection site is normal and resolves within 24 hours. If you see facial swelling, hives, vomiting, or collapse, message us on WhatsApp immediately — we respond 24/7. Serious reactions are very rare but we take them seriously.' },
  { q: 'How does cold-chain shipping work?', a: 'Every shipment is packed in pharmaceutical-grade insulated packaging with a certified gel ice pack rated to hold 2–8°C for a minimum of 48 hours. A colour-change temperature indicator strip is included. If it shows green on arrival, the cold chain held. If it has changed colour, contact us — we will resend at no charge.' },
  { q: 'Is it legal to administer vaccines at home in NZ?', a: 'Yes. VetPac operates under the ACVM Act 1997 VOI (Veterinary Operating Instruction) framework. Every vaccination plan is reviewed and authorised by a NZ-registered veterinarian before anything is dispatched. The VOI is the legal mechanism that permits administration of prescription veterinary medicines by a lay person under veterinary supervision.' },
]

const ASSIST_FAQ = [
  { q: 'What does the VetPac technician actually do?', a: 'They bring everything — the vaccine, syringe, and supplies — to your home and administer the injection themselves. You do not need to touch anything. They will also do a brief wellness check on your puppy before administering.' },
  { q: 'How long does the visit take?', a: 'Typically 20–30 minutes including the wellness check, the injection itself, and the 10-minute post-vaccination observation period. Everything is done in your home at your convenience.' },
  { q: 'What areas do you service?', a: 'VetPac Assist is available NZ-wide. Scheduling may vary by region — availability is shown when you book. Most metro areas have same-week availability.' },
  { q: 'Do I need to be home for the visit?', a: 'Yes — a responsible adult needs to be present for the visit. You do not need to do anything except let the technician in and have your puppy ready.' },
  { q: 'What if I need to reschedule?', a: 'No problem. Message us on WhatsApp up to 24 hours before your visit to reschedule. Rescheduling is free and unlimited — we work around your schedule.' },
  { q: 'Is the vaccine the same as self-administration?', a: 'Identical. The same ACVM-registered vaccine, the same cold-chain logistics, the same vet-authorised plan. The only difference is who does the injection.' },
]

// ─── STEP 2: Delivery ────────────────────────────────────────────────────────

function StepDelivery({ assistSelected, setAssistSelected, onNext, onBack }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-textPrimary">How would you like it done?</h1>
        <p className="text-sm text-textSecondary mt-1">Most customers choose to administer at home — it takes less than two minutes.</p>
      </div>

      {/* Self-admin card */}
      <div className={`rounded-card-lg border-2 transition-all ${!assistSelected ? 'border-primary' : 'border-border'}`}>
        <div onClick={() => setAssistSelected(false)} className={`p-4 cursor-pointer rounded-t-card-lg ${!assistSelected ? 'bg-primary/5' : 'bg-white hover:bg-bg/50'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${!assistSelected ? 'border-primary' : 'border-border'}`}>
              {!assistSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-textPrimary text-sm">I'll administer at home</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Most popular</span>
              </div>
              <p className="text-sm text-textSecondary mt-1">Vaccines cold-chain couriered to your door. Step-by-step guide included. 24/7 WhatsApp support throughout.</p>
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
        {/* Self-admin FAQ — always visible */}
        <div className="border-t border-border px-4 bg-white rounded-b-card-lg divide-y divide-border">
          {SELF_ADMIN_FAQ.map((item) => <Accordion key={item.q} q={item.q} a={item.a} />)}
        </div>
      </div>

      {/* Assist card */}
      <div className={`rounded-card-lg border-2 transition-all ${assistSelected ? 'border-primary' : 'border-border'}`}>
        <div onClick={() => setAssistSelected(true)} className={`p-4 cursor-pointer rounded-t-card-lg ${assistSelected ? 'bg-primary/5' : 'bg-white hover:bg-bg/50'}`}>
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
        {/* Assist FAQ — always visible */}
        <div className="border-t border-border px-4 bg-white rounded-b-card-lg divide-y divide-border">
          {ASSIST_FAQ.map((item) => <Accordion key={item.q} q={item.q} a={item.a} />)}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-textMuted hover:text-textPrimary transition-colors px-3 py-2.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Button fullWidth size="lg" onClick={onNext}>Continue →</Button>
      </div>
    </div>
  )
}

// ─── Insurance terms modal content ──────────────────────────────────────────

const INSURANCE_TERMS_CONTENT = (
  <div className="space-y-4 text-sm leading-relaxed">
    <p className="font-semibold text-textPrimary">VetPac 2-Year Puppy Cover — Policy Summary</p>
    <p>Issued by Forman Pacific LLC. This is a summary. The full policy document is available on request.</p>
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
      { t: 'Contact', b: 'support@vetpac.nz · WhatsApp (24/7)' },
    ].map(({ t, b }) => (
      <div key={t}>
        <p className="font-semibold text-textPrimary">{t}</p>
        <p className="text-textSecondary mt-0.5">{b}</p>
      </div>
    ))}
  </div>
)

const INSURANCE_FAQ = [
  { q: 'What does VetPac Cover actually cover?', a: 'Accidents and illness including surgery, hospitalisation, specialist consultations, diagnostics (X-rays, ultrasounds, blood tests), emergency treatment, and prescription medications. We cover what matters most in the first two years.' },
  { q: 'What is not covered?', a: 'Pre-existing conditions, routine preventive care (including the vaccinations you are purchasing now), elective procedures, dental disease, and breeding-related costs. Full exclusions are listed in the policy document.' },
  { q: 'Why choose the 2-year plan?', a: "The first two years of a puppy's life carry the highest risk of unexpected illness and injury. Locking in 2 years at once means your excess drops from $1,500 to $750, your rate is guaranteed for the full term, and you never have to think about renewal during the most vulnerable period." },
  { q: 'How do I make a claim?', a: 'Email your vet invoice to claims@vetpac.nz with your policy number. We process 80% of claims within 5 business days. We reimburse 80% of eligible costs above your excess directly to your nominated bank account.' },
  { q: 'Is there a waiting period?', a: 'Yes — 14 days from the date cover commences for illness claims. Accidents are covered from day one. This is standard across all pet insurance policies in NZ.' },
  { q: 'Can I cancel?', a: 'Monthly cover can be cancelled any time with no penalty. Annual and 2-year plans can be cancelled within 14 days of purchase for a full refund. After 14 days, the remaining premium is non-refundable but cover remains active for the paid period.' },
]

// ─── STEP 3: Insurance ───────────────────────────────────────────────────────

function StepInsurance({ insuranceSelected, setInsuranceSelected, insuranceBilling, setInsuranceBilling, onNext, onBack }) {
  const [termsOpen, setTermsOpen] = useState(false)
  const plans = [
    { id: 'monthly', label: 'Monthly', price: `$${INSURANCE.monthlyPrice}/mo`, sub: 'Pay month to month', excess: INSURANCE.excess, badge: null },
    { id: 'annual', label: 'Annual', price: `$${INSURANCE.annualPrice}/yr`, sub: `$${(INSURANCE.annualPrice / 12).toFixed(2)}/month`, excess: INSURANCE.excess, badge: 'Save vs monthly' },
    { id: 'twoYear', label: '2-Year upfront', price: `$${INSURANCE.twoYearPrice}`, sub: `$${(INSURANCE.twoYearPrice / 24).toFixed(2)}/month · pay once`, excess: INSURANCE.twoYearExcess, badge: 'Best value · excess halved to $750' },
  ]

  return (
    <>
      <div className="space-y-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">Protect the next two years</h1>
          <p className="text-sm text-textSecondary mt-1">The most important health window of your puppy's life.</p>
        </div>

        {/* Header callout */}
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-card-lg">
          <Heart className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-textPrimary text-sm">{INSURANCE.name}</p>
            <p className="text-sm text-textSecondary mt-1">One unexpected illness or surgery can cost $3,000–$8,000. VetPac Cover is designed for exactly this window — comprehensive accident and illness cover for the first two years.</p>
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
            className={`w-full text-left rounded-card border-2 p-3 transition-all ${!insuranceSelected ? 'border-primary/30 bg-primary/5' : 'border-border bg-white hover:border-border'}`}>
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
            <p className="font-semibold text-sm text-textPrimary">Cover questions answered</p>
          </div>
          <div className="px-4 divide-y divide-border">
            {INSURANCE_FAQ.map((item) => <Accordion key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-textMuted hover:text-textPrimary transition-colors px-3 py-2.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Button fullWidth size="lg" onClick={onNext}>Continue →</Button>
        </div>
      </div>

      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="VetPac Cover — Policy Terms">
        {INSURANCE_TERMS_CONTENT}
      </Modal>
    </>
  )
}

// ─── STEP 4: Summary + Pay ───────────────────────────────────────────────────

function StepSummary({ totals, puppyName, puppyCount, insuranceSelected, insuranceBilling, onBack, onPay, checkoutLoading }) {
  const [discountInput, setDiscountInput] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountError, setDiscountError] = useState(null)

  const vaccineAndDelivery = totals.vaccines + totals.assist + totals.freight
  const displayTotal = discountApplied ? 1.00 : vaccineAndDelivery

  const applyDiscount = () => {
    if (discountInput.trim().toLowerCase() === 'bossmode') {
      setDiscountCode(discountInput.trim())
      setDiscountApplied(true)
      setDiscountError(null)
    } else {
      setDiscountError('Invalid code.')
    }
  }

  const rows = [
    totals.vaccines > 0 && { label: `Vaccines${puppyCount > 1 ? ` (${puppyCount} puppies)` : ''}`, value: `NZD $${totals.vaccines}` },
    totals.assist > 0 && { label: `VetPac Assist (${totals.doseCount} visit${totals.doseCount !== 1 ? 's' : ''})`, value: `NZD $${totals.assist}` },
    totals.freight > 0 && { label: 'Cold-chain freight', value: `NZD $${totals.freight}` },
    insuranceSelected && totals.insurance > 0 && {
      label: `VetPac Cover (${insuranceBilling === 'twoYear' ? '2-year' : insuranceBilling})`,
      value: `NZD $${insuranceBilling === 'twoYear' ? INSURANCE.twoYearPrice : insuranceBilling === 'annual' ? INSURANCE.annualPrice : `${INSURANCE.monthlyPrice}/mo`}`,
      note: 'Billed separately',
    },
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-textPrimary">Confirm your order</h1>
        <p className="text-sm text-textSecondary mt-1">Review everything before you pay.</p>
      </div>

      {/* Order rows */}
      <div className="bg-white border border-border rounded-card-lg divide-y divide-border overflow-hidden">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-textPrimary">{row.label}</p>
              {row.note && <p className="text-xs text-textMuted">{row.note}</p>}
            </div>
            <span className="font-mono font-semibold text-sm text-textPrimary">{row.value}</span>
          </div>
        ))}

        <div className="flex items-center justify-between px-4 py-3 bg-bg">
          <span className="font-bold text-textPrimary text-sm">Vaccines due today</span>
          <span className="font-mono font-bold text-accent text-base">NZD ${displayTotal.toFixed(2)}</span>
        </div>
      </div>

      {discountApplied
        ? (
          <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-card text-sm text-green-800">
            <CheckCircle className="w-4 h-4" /> Code <strong className="mx-1">{discountCode.toUpperCase()}</strong> applied — NZD $1.00
          </div>
        ) : (
          <div className="space-y-1">
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
            {discountError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {discountError}</p>}
          </div>
        )
      }

      {/* Trust row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Shield, label: 'Vet-authorised' },
          { icon: Truck, label: 'Cold-chain certified' },
          { icon: MessageCircle, label: '24/7 WhatsApp' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 p-2.5 bg-bg border border-border rounded-card text-center">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-xs text-textSecondary font-medium">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-textMuted hover:text-textPrimary transition-colors px-3 py-2.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Button fullWidth size="lg" onClick={() => onPay(displayTotal, discountApplied, discountCode)} loading={checkoutLoading}>
          Pay NZD ${displayTotal.toFixed(2)} →
        </Button>
      </div>
      <p className="text-xs text-center text-textMuted flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> Secured by Stripe · NZD · no currency conversion
      </p>
      {insuranceSelected && (
        <p className="text-xs text-center text-textMuted">Insurance billed separately after your plan is confirmed.</p>
      )}
    </div>
  )
}

// ─── STEP 1: Vaccines ─────────────────────────────────────────────────────────

function StepVaccines({ puppyName, additionalPuppies, vaccinePlan, toggleVaccineItem, aiAssessment, aiLoading, aiError, onNext }) {
  const selected = vaccinePlan.filter((v) => v.selected)
  return (
    <div className="space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 bg-success/10 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-success/20 mb-3">
          <CheckCircle className="w-3.5 h-3.5" /> Consultation confirmed — your plan is ready
        </div>
        <h1 className="font-display font-bold text-2xl text-textPrimary">
          {additionalPuppies.length > 0 ? "Your puppies' vaccination plans" : `${puppyName}'s vaccination plan`}
        </h1>
        <p className="text-sm text-textSecondary mt-1">Reviewed and authorised by a NZ-registered veterinarian. Deselect any items you want to skip.</p>
      </div>

      {aiError && <Alert type="warning">{aiError}</Alert>}

      <PuppyPlanSection
        puppyName={puppyName}
        vaccinePlan={vaccinePlan}
        toggleVaccineItem={toggleVaccineItem}
        isLoading={aiLoading}
      />
      {additionalPuppies.map((puppy, i) => (
        <PuppyPlanSection
          key={i}
          puppyName={puppy.name || `Puppy ${i + 2}`}
          vaccinePlan={buildVaccinePlan(aiAssessment, puppy)}
          toggleVaccineItem={() => {}}
          isLoading={aiLoading}
        />
      ))}

      {selected.length === 0 && !aiLoading && <Alert type="warning">Select at least one vaccine to continue.</Alert>}

      <Button fullWidth size="lg" onClick={onNext} disabled={selected.length === 0 || aiLoading}>
        Continue →
      </Button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    dogProfile, healthHistory, lifestyle,
    additionalPuppies, numberOfPuppies,
    aiAssessment, setAiAssessment,
    vaccinePlan, toggleVaccineItem,
    assistSelected, setAssistSelected,
    insuranceSelected, setInsuranceSelected,
    insuranceBilling, setInsuranceBilling,
    setConsultPaid,
    getOrderTotals,
  } = useIntakeStore()

  const [step, setStep] = useState(1)
  const [aiLoading, setAiLoading] = useState(!aiAssessment)
  const [aiError, setAiError] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('paid') === '1') setConsultPaid(true)
  }, [])

  useEffect(() => {
    if (!aiAssessment) runAi()
  }, [])

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

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

  const totals = getOrderTotals()
  const puppyName = dogProfile.name || 'your puppy'

  const handlePay = (displayTotal, discountApplied, discountCode) => {
    setCheckoutLoading(true)
    const selectedVaccines = vaccinePlan.filter((v) => v.selected)
    const items = selectedVaccines.map((v) => ({ name: v.name, price: v.price }))

    const params = new URLSearchParams({
      mode: 'vaccines',
      puppy: puppyName,
      puppyCount: numberOfPuppies.toString(),
      total: displayTotal.toFixed(2),
      consult: '0',
      vaccines: discountApplied ? '1' : totals.vaccines.toString(),
      freight: discountApplied ? '0' : totals.freight.toString(),
      assist: discountApplied ? '0' : totals.assist.toString(),
      insurance: totals.insurance.toFixed(2),
      insuranceBilling: totals.insuranceBilling,
      items: encodeURIComponent(JSON.stringify(discountApplied ? [{ name: 'Vaccines (bossmode)', price: 1 }] : items)),
      ...(discountApplied ? { discountCode } : {}),
    })
    navigate(`/checkout?${params.toString()}`)
    setCheckoutLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Sticky header */}
      <div className="border-b border-border bg-white px-4 py-3 sticky top-0 z-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="font-display font-bold text-base text-primary">VetPac</Link>
            <span className="text-xs text-textMuted">Step {step} of {STEPS.length}</span>
          </div>
          <StepBar step={step} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 1 && (
          <StepVaccines
            puppyName={puppyName}
            additionalPuppies={additionalPuppies}
            vaccinePlan={vaccinePlan}
            toggleVaccineItem={toggleVaccineItem}
            aiAssessment={aiAssessment}
            aiLoading={aiLoading}
            aiError={aiError}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepDelivery
            assistSelected={assistSelected}
            setAssistSelected={setAssistSelected}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepInsurance
            insuranceSelected={insuranceSelected}
            setInsuranceSelected={setInsuranceSelected}
            insuranceBilling={insuranceBilling}
            setInsuranceBilling={setInsuranceBilling}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <StepSummary
            totals={totals}
            puppyName={puppyName}
            puppyCount={numberOfPuppies}
            insuranceSelected={insuranceSelected}
            insuranceBilling={insuranceBilling}
            onBack={() => setStep(3)}
            onPay={handlePay}
            checkoutLoading={checkoutLoading}
          />
        )}
      </div>

      <FloatingChat />
    </div>
  )
}
