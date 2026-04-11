import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import { Shield, CheckCircle, X } from 'lucide-react'
import { openChat } from '../lib/openChat'

export default function WarrantyTerms() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 space-y-8">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto">
            <Shield size={24} className="text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">VetPac Programme Warranty</h1>
          <p className="text-slate-500 text-sm">These terms apply to all VetPac Programme Warranty purchases.</p>
          <p className="text-xs text-slate-400">Last updated: April 2026</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">

          <section className="space-y-3">
            <h2 className="font-semibold text-slate-800">What is covered</h2>
            <div className="space-y-2">
              {[
                'Vaccine failure — where a vaccinated dog contracts the disease the vaccine was designed to prevent, confirmed by a registered veterinarian.',
                'Adverse reactions — any clinically significant reaction to the vaccine requiring veterinary attention within 72 hours of administration.',
                'Illness contracted during the vaccination window — where a dog contracts a preventable disease before full immunity is established (typically after the final dose in the primary course).',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle size={15} className="text-teal-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-slate-800">What is not covered</h2>
            <div className="space-y-2">
              {[
                'Pre-existing conditions diagnosed or suspected prior to the start of the vaccination programme.',
                'Illness or injury unrelated to the vaccines administered under this programme.',
                'Conditions arising from failure to follow the administration schedule or storage instructions.',
                'Claims made more than 30 days after the relevant dose was administered.',
                'Costs incurred without prior notification to VetPac (except in genuine emergencies).',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <X size={15} className="text-red-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-slate-800">How to make a claim</h2>
            <ol className="space-y-2">
              {[
                'Contact us via the chat button in your dashboard as soon as possible after the incident.',
                'Provide your order reference, your dog\'s name, and a brief description of what happened.',
                'We will request a summary from your veterinarian if clinical care was required.',
                'Valid claims are assessed within 3 business days. We will contact you with the outcome.',
                'There is no excess. There is no requirement to attend a specific clinic.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <button onClick={() => openChat('warranty-claim')} className="mt-2 w-full flex items-center justify-center gap-2 bg-[#1a3c2e] hover:bg-[#2d5a42] text-white font-semibold py-3 px-6 rounded-xl transition-colors">File a warranty claim</button>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-slate-800">Coverage period</h2>
            <p className="text-sm text-slate-700">
              The warranty is valid from the date of your first vaccination dose and remains active for the full duration of your puppy's primary vaccination programme — typically 8–12 weeks depending on the protocol. Annual booster coverage is subject to renewal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-slate-800">General conditions</h2>
            <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
              <li>This warranty is provided by VetPac and is separate from any statutory consumer rights you may have under New Zealand law.</li>
              <li>VetPac reserves the right to request reasonable supporting documentation before approving a claim.</li>
              <li>This warranty is non-transferable and applies only to the dog named on the original order.</li>
              <li>VetPac's total liability under this warranty is limited to the cost of the vaccination programme purchased.</li>
            </ul>
          </section>

          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-3">
            <p className="font-medium text-slate-700">Questions about your warranty?</p>
            <button onClick={() => openChat()} className="w-full flex items-center justify-center gap-2 bg-[#1a3c2e] hover:bg-[#2d5a42] text-white font-semibold py-3 px-6 rounded-xl transition-colors">Chat with us</button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
