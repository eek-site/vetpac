import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Package, Clock, FileText, Calendar, ArrowRight, Bell } from 'lucide-react'
import Button from '../components/ui/Button'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'

function SuccessAnimation() {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-success/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  )
}

const timeline = [
  { icon: Clock, label: 'Vet review', desc: 'A NZ-registered vet reviews your intake (within 4 hours)', status: 'in_progress' },
  { icon: FileText, label: 'VOI issued', desc: 'Your Veterinary Operating Instruction is generated', status: 'pending' },
  { icon: Package, label: 'Vaccines dispatched', desc: 'Cold-chain courier picks up your order (within 24 hours)', status: 'pending' },
  { icon: CheckCircle, label: 'Delivered', desc: '1–3 business days nationwide', status: 'pending' },
]

export default function OrderConfirmation() {
  const [params] = useSearchParams()
  const dogName = params.get('dog') || 'your dog'
  const [orderRef] = useState('VP-' + Math.random().toString(36).substr(2, 8).toUpperCase())

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <SuccessAnimation />

        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-3">
            Order confirmed! {dogName.charAt(0).toUpperCase() + dogName.slice(1)}'s health plan is underway.
          </h1>
          <p className="text-textSecondary">Order reference: <span className="font-mono font-bold text-textPrimary">{orderRef}</span></p>
          <p className="text-textMuted text-sm mt-1">A confirmation email has been sent to your inbox.</p>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-card-lg shadow-card p-8 mb-6">
          <h2 className="font-display font-semibold text-xl text-textPrimary mb-6">What happens next</h2>
          <div className="relative">
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border" />
            <div className="space-y-6">
              {timeline.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10
                      ${i === 0 ? 'bg-primary text-white' : 'bg-border text-textMuted'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="pt-1.5">
                      <p className={`font-semibold text-sm ${i === 0 ? 'text-primary' : 'text-textPrimary'}`}>{item.label}</p>
                      <p className="text-textMuted text-xs mt-0.5">{item.desc}</p>
                    </div>
                    {i === 0 && (
                      <div className="ml-auto flex-shrink-0 pt-1">
                        <span className="text-xs bg-warning/10 text-amber-700 font-semibold px-2 py-1 rounded-full">In progress</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Admin guide */}
        <div className="bg-primary rounded-card-lg p-8 text-white mb-6">
          <h2 className="font-display font-semibold text-xl mb-3">Administration guide</h2>
          <p className="text-primary-light text-sm mb-5">
            When your vaccines arrive, follow our step-by-step video guide. A trained technician will be on call if you have any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="accent">
              View Administration Guide
            </Button>
            <Button variant="secondary" className="border-white text-white hover:bg-white hover:text-primary">
              <Bell className="w-4 h-4" />
              Add dose reminders
            </Button>
          </div>
        </div>

        {/* Dose schedule */}
        <div className="bg-white rounded-card-lg shadow-card p-8 mb-6">
          <h2 className="font-display font-semibold text-xl text-textPrimary mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Your dose schedule
          </h2>
          <p className="text-textMuted text-sm mb-5">Auto-reminders will be sent 3 days before each dose ships.</p>
          <div className="space-y-3">
            {['Dose 1 — C5 (ships now)', 'Dose 2 — C5 (ships at 12 weeks)', 'Dose 3 — C5 (ships at 16 weeks)', 'Annual Booster (reminder in 11 months)'].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-textSecondary">{item}</span>
                <button className="text-xs text-primary hover:underline font-semibold">Add to calendar</button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to="/dashboard">
            <Button size="lg">
              Go to my dashboard <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-textMuted text-sm mt-4">
            Emergency line: <a href="tel:0800838722" className="text-primary font-semibold">0800 VETPAC</a> (24/7)
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
