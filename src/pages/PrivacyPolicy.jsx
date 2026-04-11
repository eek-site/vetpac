import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
// Contact via chat only

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="font-display font-bold text-xl text-textPrimary mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3 text-sm text-textSecondary leading-relaxed">{children}</div>
    </div>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 pt-24">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to VetPac
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="font-display font-bold text-3xl text-textPrimary">Privacy Policy</h1>
        </div>
        <p className="text-textMuted text-sm mb-10">Last updated: April 2025 · Effective immediately</p>

        <Section title="Who we are">
          <p>VetPac is a trading name of Forman Pacific LLC, a company registered in New Zealand. We operate an at-home puppy vaccination platform at <strong>vetpac.nz</strong>.</p>
          <p>This policy explains what personal information we collect, why we collect it, how we use and store it, and your rights under the <strong>New Zealand Privacy Act 2020</strong>.</p>
          <p>Contact: use the chat on vetpac.nz</p>
        </Section>

        <Section title="Information we collect">
          <p><strong>You provide directly:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Your name, email address, and mobile number</li>
            <li>Your puppy's name, breed, age, sex, and weight</li>
            <li>Health history responses (e.g. prior illnesses, vaccine reactions)</li>
            <li>Lifestyle information (e.g. environment, activity level)</li>
            <li>Payment details — processed directly by Stripe; we never see or store your card number</li>
          </ul>
          <p className="mt-2"><strong>Collected automatically:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Browser type, device type, and approximate location (country/region)</li>
            <li>Pages visited and events triggered on vetpac.nz (via Google Analytics and our own event log)</li>
            <li>Intake chat session identifier (a random token stored in your browser)</li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <p>We use your information to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Generate a personalised vaccination programme for your puppy</li>
            <li>Provide your intake details to a NZ-registered veterinarian for review and sign-off</li>
            <li>Process your payment and send order confirmation emails</li>
            <li>Dispatch cold-chain vaccine kits and coordinate delivery</li>
            <li>Send dose-due reminders and follow-up care information</li>
            <li>Respond to support enquiries</li>
            <li>Improve our platform (using anonymised, aggregated data only)</li>
          </ul>
          <p className="mt-2">We <strong>do not</strong> sell, rent, or share your personal information with third parties for marketing purposes.</p>
        </Section>

        <Section title="AI processing">
          <p>Your intake chat conversation is processed by <strong>Anthropic's Claude AI</strong> to assist in preparing a health summary for veterinary review. This is a core part of the service.</p>
          <p>AI-generated content is always reviewed and authorised by a NZ-registered veterinarian before any vaccination plan or Veterinary Operating Instruction (VOI) is issued. The AI does not make final clinical decisions.</p>
          <p>Anthropic processes data under its <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">privacy policy</a> as a data processor on our behalf. No chat data is used to train Anthropic's models without explicit consent.</p>
        </Section>

        <Section title="Health information">
          <p>The health and lifestyle information you provide about your puppy is <strong>health information</strong> as defined under the Privacy Act 2020. We handle it with extra care:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>It is shared only with the reviewing veterinarian and our operating platform</li>
            <li>It is stored securely in our database (Supabase, hosted in the US on AWS) with encryption at rest and in transit</li>
            <li>It is not disclosed to insurance companies, government agencies, or other third parties without your consent, except where required by law</li>
          </ul>
        </Section>

        <Section title="Cookies and tracking">
          <p>We use the following technologies:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Google Analytics 4</strong> — anonymised traffic analytics. You can opt out via <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's opt-out tool</a>.</li>
            <li><strong>Google Ads</strong> — conversion measurement (we do not use remarketing lists).</li>
            <li><strong>localStorage</strong> — to remember your intake progress so you can continue where you left off. This data stays on your device and is not sent to advertising networks.</li>
            <li><strong>Stripe</strong> — sets cookies during checkout for fraud prevention and payment processing.</li>
          </ul>
          <p className="mt-2">We do not use tracking cookies for advertising profiling.</p>
        </Section>

        <Section title="Data storage and security">
          <p>Your data is stored on:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Supabase</strong> (PostgreSQL database, AWS us-east-1 region) — intake records, session data, and event logs</li>
            <li><strong>Stripe</strong> (payment data) — subject to Stripe's PCI-DSS compliant infrastructure</li>
            <li><strong>Vercel</strong> (serverless functions and hosting) — API logs retained for 30 days</li>
          </ul>
          <p className="mt-2">All data is encrypted in transit (TLS 1.2+) and at rest. Access to production databases is restricted to authorised VetPac staff only.</p>
        </Section>

        <Section title="Data retention">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Intake and order records</strong> — retained for 7 years for veterinary and compliance purposes under the ACVM Act 1997</li>
            <li><strong>Chat transcripts</strong> — retained for 2 years</li>
            <li><strong>Analytics events</strong> — retained for 12 months</li>
            <li><strong>Payment records</strong> — retained by Stripe per their policy</li>
          </ul>
          <p className="mt-2">You may request deletion of your personal data outside of records we are legally required to retain. See <em>Your rights</em> below.</p>
        </Section>

        <Section title="Your rights (Privacy Act 2020)">
          <p>Under the Privacy Act 2020 you have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Access</strong> the personal information we hold about you</li>
            <li><strong>Correct</strong> any inaccurate information</li>
            <li><strong>Request deletion</strong> of your data (subject to retention obligations above)</li>
            <li><strong>Object</strong> to processing where we rely on legitimate interests</li>
            <li><strong>Complain</strong> to the <a href="https://www.privacy.org.nz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Office of the Privacy Commissioner</a> if you believe we have breached the Act</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, contact us via the chat on vetpac.nz. We will respond within 20 working days as required by the Act.</p>
        </Section>

        <Section title="Children">
          <p>VetPac is intended for use by adults (18+). We do not knowingly collect personal information from anyone under 18. If you believe a minor has submitted information to us, please contact us and we will promptly delete it.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>We may update this policy from time to time. When we do, we will update the date at the top of this page. Material changes will be notified by email to registered customers.</p>
        </Section>

        <Section title="Contact us">
          <p>For any privacy questions or requests:</p>
          <p>
            <strong>VetPac (Forman Pacific LLC)</strong><br />
            Contact: chat with us at vetpac.nz
          </p>
        </Section>

        <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-primary">
          <Link to="/terms" className="hover:underline">Terms of Service →</Link>
          <Link to="/legal" className="hover:underline">Legal & Compliance →</Link>
        </div>
      </div>
    </div>
  )
}
