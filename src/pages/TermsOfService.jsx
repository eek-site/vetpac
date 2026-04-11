import { Link } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'
import { openChat } from '../lib/openChat'
// Contact is handled via the in-app chat

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="font-display font-bold text-xl text-textPrimary mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3 text-sm text-textSecondary leading-relaxed">{children}</div>
    </div>
  )
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 pt-24">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to VetPac
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="font-display font-bold text-3xl text-textPrimary">Terms of Service</h1>
        </div>
        <p className="text-textMuted text-sm mb-10">Last updated: April 2025 · Governed by the laws of New Zealand</p>

        <Section title="Agreement to these terms">
          <p>By accessing or using VetPac at <strong>vetpac.nz</strong>, you agree to be bound by these Terms of Service and our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. If you do not agree, do not use our platform.</p>
          <p>These terms form a legally binding agreement between you and <strong>Forman Pacific LLC</strong>, a Limited Liability Company registered in Delaware, USA (File No. 10462509) ("VetPac", "we", "us", "our").</p>
        </Section>

        <Section title="The VetPac service">
          <p>VetPac provides an at-home puppy vaccination platform that includes:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>An AI-assisted intake questionnaire to gather your puppy's health and lifestyle information</li>
            <li>A personalised vaccination programme reviewed and authorised by a NZ-registered veterinarian</li>
            <li>Cold-chain delivery of veterinary-grade vaccines to your home</li>
            <li>Step-by-step administration guides and 24/7 chat support</li>
            <li>Optional in-home vaccinator service (VetPac Assist) and health programme warranty (VetPac Warranty)</li>
          </ul>
        </Section>

        <Section title="Regulatory framework">
          <p>VetPac operates under the <strong>Agricultural Compounds and Veterinary Medicines Act 1997 (ACVM Act)</strong> using a Veterinary Operating Instruction (VOI) framework. Every vaccination plan must be reviewed and signed off by a NZ-registered veterinarian before anything is dispatched.</p>
          <p>By completing the intake and purchasing a plan, you acknowledge that:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>You are responsible for following the administration instructions provided in your kit</li>
            <li>You must administer vaccines in strict accordance with the VOI and enclosed guide</li>
            <li>You must contact a veterinarian immediately if your puppy shows any adverse reaction</li>
            <li>VetPac does not replace a physical veterinary examination for sick or symptomatic animals</li>
          </ul>
        </Section>

        <Section title="Eligibility">
          <p>You may use VetPac if you:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Are 18 years of age or older</li>
            <li>Are located in New Zealand</li>
            <li>Are the owner or authorised carer of the puppy for which you are ordering</li>
            <li>Have provided accurate and complete information in the intake questionnaire</li>
          </ul>
          <p className="mt-2">We reserve the right to decline service to any puppy assessed as ineligible by our reviewing veterinarian (for example, a puppy showing signs of current illness). In such cases, a full refund will be issued.</p>
        </Section>

        <Section title="Accurate information">
          <p>You warrant that all information you provide during intake is truthful, accurate, and complete. Providing false or misleading health information about your puppy may result in an inappropriate vaccination plan and could harm your pet. VetPac and our veterinary partners accept no liability for outcomes resulting from inaccurate information you have provided.</p>
        </Section>

        <Section title="Payments and refunds">
          <p>Payments are processed securely by <strong>Stripe</strong>. By placing an order, you authorise Stripe to charge your payment method for the amounts shown at checkout.</p>
          <p><strong>Consultation fee:</strong> Non-refundable once the AI assessment has been completed and submitted to a vet for review.</p>
          <p><strong>Vaccine orders:</strong> You may request a refund within 24 hours of placing an order, provided the order has not yet been dispatched. Once cold-chain goods have been shipped, we are unable to accept returns for safety and regulatory reasons.</p>
          <p><strong>Declined orders:</strong> If a veterinarian declines to issue a VOI for your puppy, you will receive a full refund of your vaccine order within 5 business days.</p>
          <p><strong>VetPac Warranty:</strong> Governed by the separate service warranty agreement. Refer to <Link to="/insurance-terms" className="text-primary hover:underline">Warranty Terms</Link>.</p>
        </Section>

        <Section title="Delivery and cold chain">
          <p>Vaccines are shipped via cold-chain courier. You are responsible for:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Ensuring someone is available to receive the delivery promptly</li>
            <li>Storing vaccines in accordance with the instructions included in your kit (typically 2–8°C refrigerated)</li>
            <li>Not using vaccines if the cold-chain packaging indicator shows excursion beyond safe temperature ranges</li>
          </ul>
          <p className="mt-2">VetPac is not liable for vaccine efficacy if storage instructions are not followed after delivery.</p>
        </Section>

        <Section title="Limitation of liability">
          <p>To the fullest extent permitted by New Zealand law:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>VetPac's total liability to you for any claim arising from these terms or the service will not exceed the amount you paid for the relevant order</li>
            <li>We are not liable for any indirect, consequential, or incidental losses, including loss of data, business, or revenue</li>
            <li>We do not exclude or limit liability where to do so would be unlawful under the <strong>Consumer Guarantees Act 1993</strong> or the <strong>Fair Trading Act 1986</strong></li>
          </ul>
        </Section>

        <Section title="Consumer Guarantees Act 1993">
          <p>If you are a consumer under the CGA, our services come with guarantees that cannot be excluded. Where a service fails to meet a consumer guarantee, you may be entitled to have it remedied. Nothing in these terms limits your rights under the CGA or the Fair Trading Act 1986.</p>
        </Section>

        <Section title="Intellectual property">
          <p>All content on VetPac — including the platform, vaccination protocols, AI prompts, guides, and branding — is owned by Forman Pacific LLC and is protected by copyright. You may not reproduce, distribute, or create derivative works without our written permission.</p>
        </Section>

        <Section title="Acceptable use">
          <p>You must not:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use VetPac for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, scrape, or automate access to our platform</li>
            <li>Submit false or misleading health information</li>
            <li>Use discount codes or promotions in ways not intended or authorised by us</li>
            <li>Resell or supply VetPac products or services to third parties without authorisation</li>
          </ul>
        </Section>

        <Section title="Termination">
          <p>We reserve the right to suspend or terminate your access to VetPac at any time if we reasonably believe you have breached these terms or are misusing the service. Pending orders will be fulfilled or refunded at our discretion.</p>
        </Section>

        <Section title="Changes to the service or terms">
          <p>We may update these terms or change the service from time to time. We will provide reasonable notice of material changes by email or by posting on our website. Continued use of the service after changes take effect constitutes acceptance of the updated terms.</p>
        </Section>

        <Section title="Governing law and disputes">
          <p>These terms are governed by the laws of New Zealand. Any dispute that cannot be resolved informally should be referred to the <a href="https://www.disputes.co.nz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Disputes Tribunal</a> or the New Zealand courts, which have exclusive jurisdiction.</p>
          <p>Before taking formal action, please contact us — we are committed to resolving issues fairly and promptly.</p>
          <button onClick={() => openChat('dispute')} className="mt-3 inline-flex items-center gap-2 bg-[#1a3c2e] hover:bg-[#2d5a42] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">Chat with us</button>
        </Section>

        <Section title="Contact">
          <p className="mb-3"><strong>VetPac (Forman Pacific LLC)</strong></p>
          <button onClick={() => openChat()} className="inline-flex items-center gap-2 bg-[#1a3c2e] hover:bg-[#2d5a42] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">Chat with us</button>
        </Section>

        <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-primary">
          <Link to="/privacy" className="hover:underline">Privacy Policy →</Link>
          <Link to="/legal" className="hover:underline">Legal & Compliance →</Link>
          <Link to="/insurance-terms" className="hover:underline">Warranty Terms →</Link>
        </div>
      </div>
    </div>
  )
}
