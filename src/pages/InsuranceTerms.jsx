import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
// Contact is handled via the in-app chat — no direct email links

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="font-display font-bold text-xl text-textPrimary mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3 text-sm text-textSecondary leading-relaxed">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border/60 last:border-0">
      <span className="text-textMuted">{label}</span>
      <span className="font-semibold text-textPrimary text-right">{value}</span>
    </div>
  )
}

export default function WarrantyTerms() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Back link */}
        <Link to="/intake/review" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to your plan
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-10">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-textPrimary mb-1">VetPac Puppy Warranty</h1>
            <p className="text-textSecondary">Service Warranty Terms and Conditions</p>
            <p className="text-xs text-textMuted mt-1">Provided by VetPac · Effective 1 April 2026 · Version 2.0</p>
          </div>
        </div>

        {/* Important notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-card-lg p-5 mb-10 text-sm text-textSecondary">
          <p className="font-semibold text-textPrimary mb-1">Important notice</p>
          <p>The VetPac Puppy Warranty is a <strong className="text-textPrimary">service warranty</strong> provided by VetPac on the outcomes of your puppy's VetPac health programme. It is <strong className="text-textPrimary">not an insurance product</strong> and is not regulated under the Insurance (Prudential Supervision) Act 2010 (NZ) or the Financial Markets Conduct Act 2013 (NZ). By purchasing this warranty you enter into a service agreement directly with VetPac and acknowledge it operates under the Consumer Guarantees Act 1993 and Fair Trading Act 1986 (NZ).</p>
        </div>

        <Section title="1. Warranty at a glance">
          <div className="bg-white rounded-card border border-border p-4">
            <Row label="Warranty claim limit" value="NZD $5,000 per warranty period" />
            <Row label="Costs covered" value="100% of eligible vet costs above the service fee" />
            <Row label="Service fee per claim" value="NZD $1,500 (monthly/annual) · NZD $750 (2-year upfront)" />
            <Row label="Monthly plan fee" value="NZD $24.99/month" />
            <Row label="Annual plan fee" value="NZD $259/year" />
            <Row label="2-Year upfront fee" value="NZD $489 · rate locked for full term" />
            <Row label="Activation period" value="14 days for illness · immediate for injuries" />
            <Row label="Warranty provider" value="VetPac" />
            <Row label="Governing law" value="New Zealand" />
          </div>
        </Section>

        <Section title="2. What this warranty covers">
          <p>Subject to the terms, conditions, and exclusions of this warranty agreement, VetPac will cover 100% of eligible veterinary costs (above the applicable service fee) incurred as a result of:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-3">
            <li>Accidental injuries — effective from the warranty start date</li>
            <li>Sudden onset illness — after the 14-day activation period</li>
            <li>Surgery and hospitalisation required as a result of a covered condition</li>
            <li>Diagnostic tests, laboratory fees, X-rays, ultrasound, MRI, and CT scans</li>
            <li>Prescribed medications directly related to a covered condition</li>
            <li>Specialist and emergency vet consultations</li>
            <li>Overnight hospitalisation and intensive care</li>
            <li>Physiotherapy and hydrotherapy (with veterinary referral)</li>
            <li>Euthanasia costs where recommended by a NZ-registered veterinarian on humane grounds</li>
          </ul>
        </Section>

        <Section title="3. What is not covered (exclusions)">
          <p>This warranty does not cover any of the following:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-3">
            <li><strong className="text-textPrimary">Pre-existing conditions</strong> — any condition that existed, was diagnosed, or showed clinical signs before the warranty start date, or within any applicable activation period</li>
            <li><strong className="text-textPrimary">Routine and preventive care</strong> — including vaccinations, flea, tick and worming treatments, microchipping, nail trimming, and health checks</li>
            <li><strong className="text-textPrimary">Dental disease</strong> — unless caused directly by an accidental injury</li>
            <li><strong className="text-textPrimary">Elective and cosmetic procedures</strong> — including desexing (unless medically required), ear cropping, tail docking, and dewclaw removal</li>
            <li><strong className="text-textPrimary">Breeding-related costs</strong> — including pregnancy, whelping, caesarean sections (unless emergency), and infertility treatment</li>
            <li><strong className="text-textPrimary">Behavioural conditions</strong> — including anxiety treatment, training, and behavioural therapy</li>
            <li><strong className="text-textPrimary">Parasites</strong> — treatment of fleas, ticks, mites, worms, or heartworm</li>
            <li><strong className="text-textPrimary">Dietary and nutritional costs</strong> — including prescription diets, supplements, and vitamins unless prescribed as direct treatment for a covered condition</li>
            <li><strong className="text-textPrimary">Experimental treatments</strong> — treatments not recognised by the New Zealand Veterinary Association</li>
          </ul>
        </Section>

        <Section title="4. Activation periods">
          <div className="bg-white rounded-card border border-border p-4">
            <Row label="Accidental injuries" value="Immediate — from warranty start date" />
            <Row label="Illness and disease" value="14 days from warranty start date" />
            <Row label="Cruciate ligament conditions" value="6 months from warranty start date" />
            <Row label="Orthopaedic and hip conditions" value="6 months from warranty start date" />
            <Row label="Hereditary and congenital conditions" value="14 days from warranty start date" />
          </div>
          <p className="mt-3">Any condition first manifesting during an activation period is treated as pre-existing and excluded for the life of the warranty.</p>
        </Section>

        <Section title="5. How to make a claim">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Obtain a detailed invoice and clinical notes from your veterinarian following treatment.</li>
            <li>Submit your claim within 90 days of treatment via the chat button on your dashboard, with your invoice, clinical notes, and warranty reference number.</li>
            <li>VetPac will assess your claim within 10 business days of receiving all required documentation.</li>
            <li>Approved claim payments will be made directly to your nominated bank account within 5 business days of approval.</li>
            <li>If your claim is declined, you will receive a written explanation with the reasons for the decision.</li>
          </ol>
          <p className="mt-3">VetPac reserves the right to request additional veterinary records, second opinions, or independent assessments to evaluate a claim.</p>
        </Section>

        <Section title="6. Plan fees and billing">
          <p>Your plan fee is charged in advance. Annual plans are charged as a single payment at the start of each warranty year. Monthly plans are charged on the same date each month.</p>
          <p>The 2-year upfront plan fee is locked for the full 2-year term provided your warranty remains continuously active.</p>
          <p>Plan fees may be reviewed annually. Any change will be communicated in writing at least 30 days before it takes effect.</p>
        </Section>

        <Section title="7. Cancellation and refunds">
          <p>The VetPac Programme Warranty is a one-time fee. There is no ongoing subscription and nothing to cancel.</p>
          <p><strong className="text-textPrimary">14-day refund period:</strong> You may request a full refund within 14 days of purchase, provided no claim has been made or is pending.</p>
          <p><strong className="text-textPrimary">After 14 days:</strong> The warranty fee is non-refundable once the 14-day period has passed or a claim has been paid.</p>
          <p><strong className="text-textPrimary">Cancellation by VetPac:</strong> VetPac reserves the right to void this warranty if materially false information has been provided or if continuing the warranty would be unlawful. In such cases a pro-rata refund will be issued.</p>
        </Section>

        <Section title="8. Duration">
          <p>The VetPac Programme Warranty is a one-time purchase. It covers your puppy's VetPac vaccination programme from the date of first dose administration until full immunity is established — typically 4 weeks after the final dose (approximately 14 weeks total).</p>
          <p>There is no automatic renewal. If you purchase a future VetPac programme for your puppy (such as an annual booster), a new warranty may be purchased at that time.</p>
        </Section>

        <Section title="9. Your obligations">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must provide accurate and complete information at the time of purchase and when making a claim. Providing false or misleading information may result in cancellation of the warranty and recovery of any payments made.</li>
            <li>You must take reasonable steps to maintain your puppy's health, including keeping vaccinations current where appropriate.</li>
            <li>You must seek veterinary treatment promptly when your puppy is injured or unwell. Unreasonable delay may affect your ability to claim.</li>
            <li>You must notify VetPac of any change in your puppy's circumstances that may affect the warranty, including a change of address.</li>
          </ul>
        </Section>

        <Section title="10. Privacy">
          <p>VetPac collects and holds personal and veterinary information for the purpose of administering your warranty and assessing claims. Your information will not be disclosed to third parties except where required by law, where necessary to assess a claim, or with your consent.</p>
          <p>You have the right to access and correct personal information held about you under the Privacy Act 2020 (NZ). To make a request, use the chat button on vetpac.nz.</p>
        </Section>

        <Section title="11. Disputes">
          <p>If you are not satisfied with a claim decision or any aspect of your warranty, you may lodge a complaint via the chat button on vetpac.nz. VetPac will acknowledge your complaint within 2 business days and provide a resolution within 20 business days.</p>
          <p>If you remain unsatisfied, disputes may be referred to the New Zealand Disputes Tribunal for claims up to NZD $30,000, or resolved under the Consumer Guarantees Act 1993.</p>
        </Section>

        <Section title="12. Governing law">
          <p>This warranty is governed by the laws of New Zealand, including the Consumer Guarantees Act 1993 and the Fair Trading Act 1986. Any disputes shall be subject to the exclusive jurisdiction of the New Zealand courts.</p>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-xs text-textMuted space-y-1">
          <p>VetPac Puppy Warranty is provided by <strong className="text-textPrimary">VetPac</strong>. This is a service warranty, not an insurance product.</p>
          <p>For all warranty enquiries: use the chat button on <strong>vetpac.nz</strong> — available 24/7.</p>
          <p className="mt-3">These terms were last updated on 1 April 2026. VetPac reserves the right to amend these terms with 30 days written notice.</p>
        </div>

      </div>
    </div>
  )
}
