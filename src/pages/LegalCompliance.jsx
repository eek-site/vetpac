import { Link } from 'react-router-dom'
import { Scale, ArrowLeft, CheckCircle } from 'lucide-react'
import { SITE_EMAIL, mailtoHref } from '../lib/site-email'

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="font-display font-bold text-xl text-textPrimary mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3 text-sm text-textSecondary leading-relaxed">{children}</div>
    </div>
  )
}

function ComplianceBadge({ children }) {
  return (
    <div className="flex items-start gap-3 bg-success/5 border border-success/20 rounded-card p-3">
      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
      <span className="text-sm text-textSecondary">{children}</span>
    </div>
  )
}

export default function LegalCompliance() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 pt-24">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to VetPac
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-6 h-6 text-primary" />
          <h1 className="font-display font-bold text-3xl text-textPrimary">Legal & Compliance</h1>
        </div>
        <p className="text-textMuted text-sm mb-10">VetPac's regulatory and compliance framework — April 2025</p>

        <Section title="Regulatory overview">
          <p>VetPac operates within a specific regulatory framework designed to enable safe, veterinarian-authorised at-home puppy vaccinations in New Zealand. This page summarises our compliance obligations and how we meet them.</p>
          <div className="space-y-2 mt-4">
            <ComplianceBadge>ACVM Act 1997 — Veterinary Operating Instruction (VOI) framework</ComplianceBadge>
            <ComplianceBadge>NZ Privacy Act 2020 — personal and health information handling</ComplianceBadge>
            <ComplianceBadge>Consumer Guarantees Act 1993 — consumer rights for NZ customers</ComplianceBadge>
            <ComplianceBadge>Fair Trading Act 1986 — accurate and non-misleading representations</ComplianceBadge>
            <ComplianceBadge>PCI-DSS — payment processing via Stripe</ComplianceBadge>
          </div>
        </Section>

        <Section title="ACVM Act 1997 — Veterinary Operating Instructions">
          <p>The <strong>Agricultural Compounds and Veterinary Medicines Act 1997 (ACVM Act)</strong> governs the use of veterinary medicines in New Zealand, including vaccines. Under the Act, prescription veterinary medicines may only be used under the authority of a registered veterinarian.</p>
          <p>VetPac uses the <strong>Veterinary Operating Instruction (VOI)</strong> mechanism permitted under the ACVM Act. This means:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Every vaccination plan is reviewed by a NZ-registered veterinarian</li>
            <li>The vet issues a VOI authorising the specific products, doses, and schedule for your puppy</li>
            <li>The VOI is specific to your puppy and cannot be transferred or reused</li>
            <li>You must follow the VOI exactly — any deviation should be discussed with a vet before proceeding</li>
          </ul>
          <p className="mt-2">VetPac does not supply vaccines without a valid VOI. All VOI records are retained for the period required by MPI and the relevant veterinary professional body.</p>
        </Section>

        <Section title="Veterinary oversight">
          <p>Our reviewing veterinarians are:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Registered with the <strong>Veterinary Council of New Zealand (VCNZ)</strong></li>
            <li>Covered by appropriate professional indemnity insurance</li>
            <li>Bound by the VCNZ Code of Professional Conduct</li>
          </ul>
          <p className="mt-2">The AI assessment produced during your intake is an <em>assistance tool</em> for the vet — it does not replace professional judgement. The reviewing vet may decline to issue a VOI or request additional information at any time.</p>
        </Section>

        <Section title="Vaccine products">
          <p>All vaccines supplied by VetPac are:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Registered with the <strong>Ministry for Primary Industries (MPI)</strong> under the ACVM Act</li>
            <li>Sourced from licensed NZ veterinary pharmaceutical distributors</li>
            <li>Stored and transported within validated cold-chain conditions (2–8°C)</li>
            <li>Within their expiry date at the time of dispatch</li>
          </ul>
          <p className="mt-2">If you have any concerns about a product you have received, contact us at <a href={mailtoHref('Product concern')} className="text-primary hover:underline">{SITE_EMAIL}</a> immediately. Do not use the product until we have confirmed it is safe to do so.</p>
        </Section>

        <Section title="Animal welfare">
          <p>VetPac takes animal welfare seriously. Our platform is designed only for healthy puppies undergoing routine preventive vaccination. We do not supply vaccines for sick animals, and our intake process includes screening questions specifically designed to identify contraindications.</p>
          <p>If at any point you believe your puppy is unwell, stop and contact a local veterinarian in person. Our 24/7 WhatsApp support team can help you assess whether to proceed or seek immediate care.</p>
          <p>Our operations are consistent with the <strong>Animal Welfare Act 1999</strong>. We have a duty of care and we take it seriously.</p>
        </Section>

        <Section title="Privacy Act 2020 — health information">
          <p>The health information you provide about your puppy is subject to heightened protections under the Privacy Act 2020 (Information Privacy Principle 10). We collect health information only to the extent necessary to provide the service and to support veterinary assessment.</p>
          <p>Full details of how we handle your information are in our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
        </Section>

        <Section title="AI and clinical decisions">
          <p>VetPac uses AI (Anthropic Claude) to assist in gathering and summarising intake information. We are committed to responsible AI use:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>AI does not make clinical decisions — all decisions are made by a NZ-registered vet</li>
            <li>AI outputs are presented to the vet as a summary to assist, not replace, their assessment</li>
            <li>We do not use AI to deny service without human review</li>
            <li>Our AI prompts are designed to flag uncertainty and escalate to human review where appropriate</li>
          </ul>
        </Section>

        <Section title="Advertising and representations">
          <p>All claims on vetpac.nz about our products, service, and outcomes are substantiated and comply with the <strong>Fair Trading Act 1986</strong>. We do not make false, misleading, or unsubstantiated claims about vaccine efficacy or veterinary outcomes.</p>
          <p>Testimonials and case studies on our site reflect genuine customer experiences. We do not publish paid or incentivised testimonials without clear disclosure.</p>
        </Section>

        <Section title="Dispute resolution">
          <p>If you have a complaint about VetPac:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Contact us at <a href={mailtoHref('Complaint')} className="text-primary hover:underline">{SITE_EMAIL}</a> — we aim to resolve complaints within 5 business days</li>
            <li>If we cannot resolve your complaint, you may refer it to the <a href="https://www.disputes.co.nz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Disputes Tribunal</a></li>
            <li>For privacy-related complaints: the <a href="https://www.privacy.org.nz/about-us/contact/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Office of the Privacy Commissioner</a></li>
            <li>For concerns about veterinary care: the <a href="https://www.veterinarycouncil.org.nz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Veterinary Council of New Zealand</a></li>
          </ol>
        </Section>

        <Section title="Company information">
          <p>
            <strong>VetPac</strong> is a trading name of <strong>Forman Pacific LLC</strong>.<br />
            New Zealand company.<br />
            Contact: <a href={mailtoHref('Legal enquiry')} className="text-primary hover:underline">{SITE_EMAIL}</a>
          </p>
        </Section>

        <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-primary">
          <Link to="/privacy" className="hover:underline">Privacy Policy →</Link>
          <Link to="/terms" className="hover:underline">Terms of Service →</Link>
          <Link to="/insurance-terms" className="hover:underline">Insurance Terms →</Link>
        </div>
      </div>
    </div>
  )
}
