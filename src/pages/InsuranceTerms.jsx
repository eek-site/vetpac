import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import { SITE_EMAIL, mailtoHref } from '../lib/site-email'

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

export default function InsuranceTerms() {
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
            <h1 className="font-display font-bold text-3xl text-textPrimary mb-1">VetPac Health Cover</h1>
            <p className="text-textSecondary">Policy Terms and Conditions</p>
            <p className="text-xs text-textMuted mt-1">Issued by Forman Pacific LLC · Effective 1 January 2025 · Version 1.0</p>
          </div>
        </div>

        {/* Important notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-card-lg p-5 mb-10 text-sm text-amber-800">
          <p className="font-semibold mb-1">Important notice</p>
          <p>VetPac Health Cover is a health service agreement provided by Forman Pacific LLC. It is not a regulated insurance product under the Insurance (Prudential Supervision) Act 2010 (NZ). By purchasing this cover you acknowledge that it is a contractual service agreement between you and Forman Pacific LLC and is not underwritten by a licensed insurer. These terms govern your rights and obligations under that agreement.</p>
        </div>

        <Section title="1. Cover at a glance">
          <div className="bg-white rounded-card border border-border p-4">
            <Row label="Annual benefit limit" value="NZD $15,000 per policy year" />
            <Row label="Reimbursement rate" value="80% of eligible expenses after excess" />
            <Row label="Excess per claim" value="NZD $200" />
            <Row label="Introductory weekly rate" value="NZD $4.99/week" />
            <Row label="Annual billing" value="NZD $259/year" />
            <Row label="Monthly billing" value="NZD $24.99/month" />
            <Row label="Introductory rate guarantee" value="Locked in for the life of your policy" />
            <Row label="Provider" value="Forman Pacific LLC" />
            <Row label="Governing law" value="New Zealand" />
          </div>
        </Section>

        <Section title="2. What is covered">
          <p>Subject to the terms, conditions, exclusions, and limits of this policy, VetPac Health Cover reimburses 80% of eligible veterinary expenses (after the excess) incurred as a result of:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-3">
            <li>Accidental injuries — effective from the policy start date</li>
            <li>Sudden onset illness — after the 30-day illness waiting period</li>
            <li>Surgery and hospitalisation required as a result of a covered condition</li>
            <li>Diagnostic tests, laboratory fees, X-rays, ultrasound, MRI, and CT scans</li>
            <li>Prescribed medications directly related to a covered condition</li>
            <li>Specialist and emergency vet consultations</li>
            <li>Overnight hospitalisation and intensive care</li>
            <li>Physiotherapy and hydrotherapy (with veterinary referral)</li>
            <li>Euthanasia costs where recommended by a registered veterinarian on humane grounds</li>
          </ul>
        </Section>

        <Section title="3. What is not covered (exclusions)">
          <p>This policy does not cover any of the following:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-3">
            <li><strong className="text-textPrimary">Pre-existing conditions</strong> — any condition that existed, was diagnosed, or showed clinical signs before the policy start date, or within any applicable waiting period</li>
            <li><strong className="text-textPrimary">Routine and preventive care</strong> — including vaccinations, flea, tick and worming treatments, microchipping, nail trimming, and health checks</li>
            <li><strong className="text-textPrimary">Dental disease</strong> — unless the dental injury was caused directly by an accident</li>
            <li><strong className="text-textPrimary">Elective and cosmetic procedures</strong> — including desexing (unless medically required), ear cropping, tail docking, and dewclaw removal</li>
            <li><strong className="text-textPrimary">Breeding-related costs</strong> — including pregnancy, whelping, caesarean sections (unless emergency), and infertility treatment</li>
            <li><strong className="text-textPrimary">Behavioural conditions</strong> — including anxiety treatment, training, and behavioural therapy</li>
            <li><strong className="text-textPrimary">Parasites</strong> — treatment of fleas, ticks, mites, worms, or heartworm</li>
            <li><strong className="text-textPrimary">Dietary and nutritional costs</strong> — including prescription diets, supplements, and vitamins unless prescribed as direct treatment for a covered condition</li>
            <li><strong className="text-textPrimary">Experimental treatments</strong> — treatments not recognised by the New Zealand Veterinary Association</li>
            <li><strong className="text-textPrimary">War, terrorism, and nuclear events</strong></li>
            <li><strong className="text-textPrimary">Intentional harm</strong> — injuries caused deliberately by the policy holder or a person acting with their knowledge</li>
          </ul>
        </Section>

        <Section title="4. Waiting periods">
          <div className="bg-white rounded-card border border-border p-4">
            <Row label="Accidental injuries" value="Immediate — from policy start date" />
            <Row label="Illness and disease" value="30 days from policy start date" />
            <Row label="Cruciate ligament conditions" value="6 months from policy start date" />
            <Row label="Orthopaedic and hip conditions" value="6 months from policy start date" />
            <Row label="Hereditary and congenital conditions" value="30 days from policy start date" />
          </div>
          <p className="mt-3">No waiting period applies to accidental injuries occurring after the policy start date. Any condition first manifesting during a waiting period is treated as pre-existing and excluded for the life of the policy.</p>
        </Section>

        <Section title="5. How to make a claim">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Obtain a detailed invoice and clinical notes from your veterinarian following treatment.</li>
            <li>Submit your claim within 90 days of the date of treatment by emailing <a href={mailtoHref()} className="text-primary hover:underline">{SITE_EMAIL}</a> with your invoice, clinical notes, and policy number.</li>
            <li>Forman Pacific LLC will assess your claim within 10 business days of receiving all required documentation.</li>
            <li>Approved reimbursements will be paid directly to your nominated bank account within 5 business days of approval.</li>
            <li>If your claim is declined, you will receive a written explanation with the reasons for the decision.</li>
          </ol>
          <p className="mt-3">Forman Pacific LLC reserves the right to request additional veterinary records, second opinions, or independent medical assessments to assess a claim.</p>
        </Section>

        <Section title="6. Premiums and billing">
          <p>Your premium is charged in advance. Annual billing is charged as a single payment at the start of each policy year. Monthly billing is charged on the same date each month.</p>
          <p>The introductory rate of NZD $4.99/week is guaranteed for the life of your policy provided your policy remains continuously active. If your policy lapses and you re-enrol, the introductory rate does not apply and the current standard rate will apply.</p>
          <p>Premium rates may be reviewed annually. Any change to your premium will be communicated in writing at least 30 days before the change takes effect. Changes do not affect the introductory rate guarantee.</p>
        </Section>

        <Section title="7. Cancellation and refunds">
          <p><strong className="text-textPrimary">14-day cooling-off period:</strong> You may cancel your policy within 14 days of purchase for a full refund, provided no claims have been made during this period.</p>
          <p><strong className="text-textPrimary">After 14 days:</strong> You may cancel at any time by providing 30 days written notice to <a href={mailtoHref()} className="text-primary hover:underline">{SITE_EMAIL}</a>.</p>
          <p><strong className="text-textPrimary">Annual policy refund:</strong> If you cancel an annual policy after the cooling-off period, a pro-rata refund of the unused portion will be issued, less a NZD $25 administration fee, provided no claims have been paid during the current policy year. No refund is available if a claim has been paid in the current policy year.</p>
          <p><strong className="text-textPrimary">Monthly policy:</strong> No refund is issued for a partial month. Cancellation takes effect at the end of the current billing cycle.</p>
          <p><strong className="text-textPrimary">Cancellation by Forman Pacific LLC:</strong> We reserve the right to cancel this policy by providing 30 days written notice if premiums are overdue by more than 14 days, if you have provided materially false information, or if continuing the policy would be unlawful.</p>
        </Section>

        <Section title="8. Renewal">
          <p>This policy renews automatically at the end of each policy year unless cancelled by either party. You will receive a renewal notice at least 30 days before your renewal date. Continued payment of premiums after the renewal date constitutes acceptance of the renewal terms.</p>
          <p>Upon renewal, Forman Pacific LLC may update the policy terms, exclusions, or benefit limits. Material changes will be communicated in writing at least 30 days before they take effect.</p>
        </Section>

        <Section title="9. Your obligations">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must provide accurate and complete information at the time of application and when making a claim. Providing false or misleading information may result in cancellation of the policy and recovery of any payments made.</li>
            <li>You must take reasonable steps to maintain your puppy's health, including keeping vaccinations current where veterinarily appropriate.</li>
            <li>You must seek veterinary treatment promptly when your puppy is injured or unwell. Unreasonable delay in seeking treatment may affect your ability to claim.</li>
            <li>You must notify us of any change in your puppy's circumstances that may affect your cover, including a change of address.</li>
          </ul>
        </Section>

        <Section title="10. Privacy">
          <p>Forman Pacific LLC collects and holds personal and veterinary information for the purpose of administering your policy and assessing claims. Your information will not be disclosed to third parties except where required by law, where necessary to assess a claim (including to veterinary professionals), or with your consent.</p>
          <p>You have the right to access and correct personal information held about you under the Privacy Act 2020 (NZ). To make a request, contact <a href={mailtoHref()} className="text-primary hover:underline">{SITE_EMAIL}</a>.</p>
        </Section>

        <Section title="11. Disputes">
          <p>If you are not satisfied with a claims decision or any aspect of your policy, you may lodge a complaint by emailing <a href={mailtoHref()} className="text-primary hover:underline">{SITE_EMAIL}</a>. We will acknowledge your complaint within 2 business days and provide a resolution within 20 business days.</p>
          <p>If you remain unsatisfied following our internal process, disputes may be referred to the New Zealand Disputes Tribunal for claims up to NZD $30,000.</p>
        </Section>

        <Section title="12. Governing law">
          <p>This policy is governed by the laws of New Zealand. Any disputes arising under or in connection with this policy shall be subject to the exclusive jurisdiction of the New Zealand courts.</p>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-xs text-textMuted space-y-1">
          <p>VetPac Health Cover is issued by <strong className="text-textPrimary">Forman Pacific LLC</strong>.</p>
          <p>Registered in the United States. Operating in New Zealand under a cross-border services arrangement.</p>
          <p>For all policy enquiries: <a href={mailtoHref()} className="text-primary hover:underline">{SITE_EMAIL}</a> · WhatsApp (24/7)</p>
          <p className="mt-3">These terms were last updated on 1 January 2025. Forman Pacific LLC reserves the right to amend these terms with 30 days written notice.</p>
        </div>

      </div>
    </div>
  )
}
