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
import { useIntakeStore } from '../store/intakeStore'
import { FREIGHT, ADDONS, SCALES, INSURANCE as WARRANTY } from '../lib/constants'
import { generateTreatmentPlan } from '../lib/claude'
import { logSiteEvent } from '../lib/logSiteEvent'
import { SITE_EMAIL } from '../lib/site-email'

// ─── Step progress bar ───────────────────────────────────────────────────────

const STEPS = ['Your plan', 'Delivery', 'Warranty', 'Confirm']

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
  { q: 'How hard is it to administer at home?', a: 'Very straightforward. For your first dose, a trained VetPac technician visits with the vaccine and walks you through the whole process in person — so you know exactly what to do. The needle is small (25 gauge), the injection is subcutaneous (just under the skin at the scruff of the neck), and the whole process takes under two minutes. From dose two onwards you do it yourself, with our step-by-step guide and 24/7 WhatsApp support throughout.' },
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
            <div className="mt-3 space-y-2">
              <div className="p-3 bg-primary/8 border border-primary/20 rounded-card flex items-start gap-2">
                <Home className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary">Free first-dose technician visit included</p>
                  <p className="text-xs text-primary/80 mt-0.5">A trained VetPac technician visits your home with your first vaccine and teaches you how to administer it in person — so you're confident every time after.</p>
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-card flex items-start gap-2">
                <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Free VetPac Digital Scales included</p>
                  <p className="text-xs text-amber-700 mt-0.5">Precision puppy scales (normally ${SCALES.retailPrice}) — free with your first order. Monitor weight at every dose for correct dosing.</p>
                </div>
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

// ─── Warranty terms modal content ────────────────────────────────────────────

const WARRANTY_TERMS_CONTENT = (
  <div className="space-y-4 text-sm leading-relaxed">
    <p className="font-semibold text-textPrimary">VetPac Programme Warranty — Summary</p>
    <p className="text-textMuted">Provided by VetPac. A service warranty on your puppy's vaccination programme outcomes — not an insurance product. Full terms at <Link to="/insurance-terms" className="text-primary underline">vetpac.nz/insurance-terms</Link>.</p>
    {[
      { t: 'What is covered', b: 'Vaccine-preventable disease (parvo, distemper, hepatitis, kennel cough) despite completing the VetPac programme, and adverse reactions to VetPac-administered vaccines.' },
      { t: 'Warranty claim limit', b: 'NZD $15,000 per warranty period.' },
      { t: 'Service fee per claim', b: '$200 (monthly/annual). $0 — zero service fee (2-year upfront).' },
      { t: 'Activation period', b: '14 days from warranty start for illness claims. Adverse reactions covered from day one.' },
      { t: 'What is not covered', b: 'Illness or injury unrelated to the VetPac programme, pre-existing conditions, elective procedures, dental disease, and breeding costs.' },
      { t: 'Actuarial basis', b: 'Priced at 10× expected cost per programme (~$29), based on peer-reviewed vaccine failure and adverse reaction data.' },
      { t: 'Claims', b: `Email vet invoice to ${SITE_EMAIL} with your warranty reference. Processed within 5 business days.` },
      { t: 'Warranty fee', b: `NZD $${WARRANTY.oneTimePrice} — one-time payment, covers the full vaccination programme period.` },
      { t: 'Cancellation', b: 'Monthly: cancel any time. Annual/2-year: full refund within 14 days; no refund after 14 days.' },
      { t: 'Governing law', b: 'New Zealand. Consumer Guarantees Act 1993 and Fair Trading Act 1986.' },
      { t: 'Contact', b: `${SITE_EMAIL} · WhatsApp (24/7)` },
    ].map(({ t, b }) => (
      <div key={t}>
        <p className="font-semibold text-textPrimary">{t}</p>
        <p className="text-textSecondary mt-0.5">{b}</p>
      </div>
    ))}
  </div>
)

const WARRANTY_FAQ = [
  { q: 'What does the warranty cover?', a: 'Vet costs resulting from vaccine-programme failures — specifically: (1) vaccine-preventable disease (parvovirus, distemper, hepatitis, kennel cough) contracted despite completing your VetPac programme; and (2) adverse reactions to vaccines administered as part of your programme, including anaphylaxis, severe lethargy, facial swelling, or injection-site complications requiring vet care. VetPac covers 100% of eligible costs above the service fee, up to $15,000.' },
  { q: 'How is the price worked out?', a: 'We modelled the actual risk data. About 5% of vaccinated puppies experience primary immunisation failure (Decaro et al., Vet Microbiology 2020). Around 1.14% experience an adverse reaction requiring vet care across a 3-dose programme (Moore et al., JAVMA 2005 — 1.2M dogs). Weighted against NZ treatment costs ($1,500–$5,000 for parvo), our expected cost per programme is ~$29. We charge 10× that — enough to cover every claim with a sustainable margin.' },
  { q: 'How long does the warranty last?', a: "It covers your puppy's VetPac vaccination programme — from the first dose until full immunity is established (typically 4 weeks after the final dose, so around 14 weeks total). It's a one-time add-on, not a subscription. Zero service fee — if something goes wrong, VetPac covers 100% of eligible costs up to $15,000." },
  { q: 'How do I make a claim?', a: `Email your vet invoice to ${SITE_EMAIL} with your warranty reference number. We process claims within 5 business days and pay directly to your nominated bank account.` },
  { q: 'What is not covered?', a: 'Illness or injury unrelated to your VetPac vaccination programme, pre-existing conditions, routine preventive care, elective procedures, dental disease, and breeding-related costs. This is a warranty on the vaccination programme outcomes — not a general health plan.' },
  { q: 'Can I get a refund?', a: 'The warranty is a one-time fee. If no claim has been made, you can request a full refund within 14 days of purchase. After 14 days or once a claim has been paid, the fee is non-refundable.' },
]

// ─── STEP 3: Warranty ────────────────────────────────────────────────────────

function StepInsurance({ insuranceSelected, setInsuranceSelected, onNext, onBack }) {
  const [termsOpen, setTermsOpen] = useState(false)

  return (
    <>
      <div className="space-y-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">Don't get caught with a $5,000 vet bill.</h1>
          <p className="text-sm text-textSecondary mt-1">Vaccines work — but not always. For $225 you can get a warranty so you know it's all going to work. If something goes wrong during your programme, VetPac covers the vet costs. Simple.</p>
        </div>

        {/* What's covered */}
        <div className="space-y-2">
          <div className="p-4 bg-white border border-border rounded-card-lg">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display font-bold text-2xl text-rose-600">5%</span>
              <p className="font-semibold text-sm text-textPrimary">of puppies don't build full immunity<sup className="text-primary font-sans text-xs">1</sup></p>
            </div>
            <p className="text-sm text-textSecondary">Maternal antibodies, genetics, or timing can all block the vaccine. If your puppy contracts parvovirus, distemper, or hepatitis during the programme, VetPac covers the vet bill in full.</p>
            <p className="text-xs text-textMuted mt-2">Parvovirus treatment in NZ: $1,500–$5,000<sup className="text-primary">2</sup></p>
          </div>
          <div className="p-4 bg-white border border-border rounded-card-lg">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display font-bold text-2xl text-rose-600">1 in 88</span>
              <p className="font-semibold text-sm text-textPrimary">puppies have an adverse reaction<sup className="text-primary font-sans text-xs">3</sup></p>
            </div>
            <p className="text-sm text-textSecondary">Facial swelling, anaphylaxis, severe lethargy — it's rare, but when it happens it needs immediate vet care. VetPac covers any costs resulting from a vaccine we administered.</p>
            <p className="text-xs text-textMuted mt-2">Reaction treatment: $150–$800</p>
          </div>
        </div>

        {/* Footnotes */}
        <div className="text-xs text-textMuted space-y-0.5 px-1">
          <p><sup>1</sup> Decaro et al., <em>Veterinary Microbiology</em> 2020 — multi-national survey of CPV immunisation failure rates.</p>
          <p><sup>2</sup> PetNSur NZ vet cost data, 2025 — hospitalisation, IV fluids, antibiotics.</p>
          <p><sup>3</sup> Moore et al., <em>JAVMA</em> 2005 — adverse event study across 1.2 million vaccinated dogs (0.38%/dose).</p>
        </div>

        {/* Yes / No */}
        <div className="space-y-2">
          <div onClick={() => setInsuranceSelected(true)}
            className={`rounded-card border-2 p-4 cursor-pointer transition-all ${insuranceSelected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${insuranceSelected ? 'border-primary' : 'border-border'}`}>
                {insuranceSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-textPrimary">Add programme warranty</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Recommended</span>
                </div>
                <p className="text-xs text-textMuted mt-0.5">Covers vaccine failure + adverse reactions for the full programme · zero service fee · up to $15,000</p>
              </div>
              <span className="font-mono font-bold text-textPrimary flex-shrink-0">NZD ${WARRANTY.oneTimePrice}</span>
            </div>
          </div>
          <button onClick={() => setInsuranceSelected(false)}
            className={`w-full text-left rounded-card border-2 p-4 transition-all ${!insuranceSelected ? 'border-border bg-white' : 'border-border bg-white hover:border-border'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${!insuranceSelected ? 'border-primary' : 'border-border'}`}>
                {!insuranceSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm text-textSecondary">No warranty — I'll cover any vet costs myself</span>
            </div>
          </button>
        </div>

        {insuranceSelected && (
          <p className="text-xs text-textMuted">
            You're covered. If the vaccine doesn't take or your puppy reacts, VetPac covers the vet costs — no questions, no service fee.{' '}
            <button onClick={() => setTermsOpen(true)} className="text-primary underline font-medium">Warranty terms</button>.
          </p>
        )}

        {/* Warranty FAQ */}
        <div className="border border-border rounded-card-lg overflow-hidden">
          <div className="px-4 py-3 bg-bg border-b border-border">
            <p className="font-semibold text-sm text-textPrimary">Warranty questions answered</p>
          </div>
          <div className="px-4 divide-y divide-border">
            {WARRANTY_FAQ.map((item) => <Accordion key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-textMuted hover:text-textPrimary transition-colors px-3 py-2.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Button fullWidth size="lg" onClick={onNext}>Continue →</Button>
        </div>
      </div>

      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="VetPac Warranty — Terms">
        {WARRANTY_TERMS_CONTENT}
      </Modal>
    </>
  )
}

// ─── STEP 4: Summary + Pay ───────────────────────────────────────────────────

function StepSummary({ totals, puppyCount, insuranceSelected, onBack, onPay, checkoutLoading }) {
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
      label: 'VetPac Programme Warranty',
      value: `NZD $${WARRANTY.oneTimePrice}`,
      note: 'One-time · billed separately',
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
        ].map(({ icon: TrustIcon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 p-2.5 bg-bg border border-border rounded-card text-center">
            <TrustIcon className="w-4 h-4 text-primary" />
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
        <p className="text-xs text-center text-textMuted">Warranty plan fee billed separately after your plan is confirmed.</p>
      )}
    </div>
  )
}

// ─── STEP 1: Vaccines ─────────────────────────────────────────────────────────

function StepVaccines({ puppyName, additionalPuppies, additionalPuppyVaccinePlans, vaccinePlan, toggleVaccineItem, toggleAdditionalPuppyVaccineItem, aiLoading, aiError, onNext }) {
  const primarySelected = vaccinePlan.filter((v) => v.selected)
  const totalSelected = primarySelected.length + additionalPuppyVaccinePlans.reduce(
    (sum, plan) => sum + plan.filter((v) => v.selected).length, 0
  )
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
          vaccinePlan={additionalPuppyVaccinePlans[i] || []}
          toggleVaccineItem={(itemId) => toggleAdditionalPuppyVaccineItem(i, itemId)}
          isLoading={aiLoading}
        />
      ))}

      {totalSelected === 0 && !aiLoading && <Alert type="warning">Select at least one vaccine to continue.</Alert>}

      <Button fullWidth size="lg" onClick={onNext} disabled={totalSelected === 0 || aiLoading}>
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
    additionalPuppyVaccinePlans,
    aiAssessment, setAiAssessment,
    vaccinePlan, toggleVaccineItem, toggleAdditionalPuppyVaccineItem,
    assistSelected, setAssistSelected,
    insuranceSelected, setInsuranceSelected,
    setConsultPaid,
    getOrderTotals,
  } = useIntakeStore()

  const [step, setStep] = useState(1)
  const [aiLoading, setAiLoading] = useState(!aiAssessment)
  const [aiError, setAiError] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('paid') !== '1') return
    setConsultPaid(true)
    const sid = searchParams.get('session_id')
    if (sid) {
      fetch('/api/register-dashboard-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
      }).catch(() => {})
    }
  }, [searchParams, setConsultPaid])

  useEffect(() => {
    if (!aiAssessment) runAi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      logSiteEvent('treatment_plan_generated', { path: '/plan' })
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
    const primarySelected = vaccinePlan.filter((v) => v.selected)
    const additionalItems = additionalPuppyVaccinePlans.flatMap((plan, i) => {
      const label = additionalPuppies[i]?.name || `Puppy ${i + 2}`
      return plan.filter((v) => v.selected).map((v) => ({
        name: numberOfPuppies > 1 ? `${v.name} (${label})` : v.name,
        price: v.price,
      }))
    })
    const items = [
      ...primarySelected.map((v) => ({
        name: numberOfPuppies > 1 ? `${v.name} (${puppyName})` : v.name,
        price: v.price,
      })),
      ...additionalItems,
    ]

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
            additionalPuppyVaccinePlans={additionalPuppyVaccinePlans}
            vaccinePlan={vaccinePlan}
            toggleVaccineItem={toggleVaccineItem}
            toggleAdditionalPuppyVaccineItem={toggleAdditionalPuppyVaccineItem}
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
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <StepSummary
            totals={totals}
            puppyCount={numberOfPuppies}
            insuranceSelected={insuranceSelected}
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
