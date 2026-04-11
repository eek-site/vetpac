import { useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Package, Clock, FileText, Calendar, ArrowRight, Bell } from 'lucide-react'
import Button from '../components/ui/Button'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import { useIntakeStore } from '../store/intakeStore'

// ── .ics calendar helper ─────────────────────────────────────────────────────

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function downloadIcs({ title, description, date }) {
  const start = new Date(date)
  start.setHours(9, 0, 0, 0)
  const end = new Date(start.getTime() + 30 * 60 * 1000)
  const uid = `vetpac-${Date.now()}@vetpac.nz`
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VetPac//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function addWeeks(weeks) {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return d
}

function addMonths(months) {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d
}

function DoseSchedule({ dogName }) {
  const doses = [
    {
      label: `Dose 1 — C5`,
      sub: 'Ships now',
      date: new Date(),
      description: `Administer Dose 1 of ${dogName}'s C5 vaccine. Guide included in your kit. WhatsApp support: 24/7.`,
    },
    {
      label: `Dose 2 — C5`,
      sub: 'Ships at 12 weeks',
      date: addWeeks(4),
      description: `Administer Dose 2 of ${dogName}'s C5 vaccine. Guide included in your kit. WhatsApp support: 24/7.`,
    },
    {
      label: `Dose 3 — C5`,
      sub: 'Ships at 16 weeks',
      date: addWeeks(8),
      description: `Administer Dose 3 of ${dogName}'s C5 vaccine. Guide included in your kit. WhatsApp support: 24/7.`,
    },
    {
      label: `Annual Booster`,
      sub: 'Reminder in 11 months',
      date: addMonths(11),
      description: `${dogName}'s annual booster is due. Log in to vetpac.nz/dashboard to reorder.`,
    },
  ]

  return (
    <div className="bg-white rounded-card-lg shadow-card p-8 mb-6">
      <h2 className="font-display font-semibold text-xl text-textPrimary mb-2 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        Your dose schedule
      </h2>
      <p className="text-textMuted text-sm mb-5">Auto-reminders will be sent 3 days before each dose ships.</p>
      <div className="space-y-0">
        {doses.map((dose, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-semibold text-textPrimary">{dose.label}</p>
              <p className="text-xs text-textMuted">{dose.sub}</p>
            </div>
            <button
              onClick={() => downloadIcs({ title: `VetPac — ${dose.label} (${dogName})`, description: dose.description, date: dose.date })}
              className="text-xs text-primary hover:text-primary-dark font-semibold border border-primary/30 hover:border-primary px-3 py-1.5 rounded-card transition-colors flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" /> Add to calendar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

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
  const dogName = params.get('puppy') || 'your puppy'
  const mode = params.get('mode') || 'vaccines'
  const total = params.get('total') || '0'
  const consultFee = params.get('consult') || '0'
  const vaccinesTotal = params.get('vaccines') || '0'
  const freightTotal = params.get('freight') || '0'
  const assistTotal = params.get('assist') || '0'
  const insuranceTotal = params.get('insurance') || '0'
  const insuranceBilling = params.get('insuranceBilling') || 'annual'
  const puppyCount = parseInt(params.get('puppyCount') || '1')
  let vaccineItems = []
  try { vaccineItems = JSON.parse(decodeURIComponent(params.get('items') || '[]')) } catch { /* invalid JSON — use empty */ }

  const { ownerDetails } = useIntakeStore()
  const orderRefRef = useRef('VP-' + Math.random().toString(36).substr(2, 8).toUpperCase())
  const orderRef = orderRefRef.current
  const emailSentRef = useRef(false)

  useEffect(() => {
    if (emailSentRef.current) return
    const email = ownerDetails?.email
    if (!email) return
    emailSentRef.current = true

    const itemsToSend = vaccineItems.length > 0
      ? vaccineItems
      : mode === 'consult'
        ? [{ name: 'Initial Consultation', price: consultFee }]
        : [{ name: 'Vaccine programme', price: vaccinesTotal }]

    fetch('/api/send-order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: email,
        customerName: ownerDetails?.full_name || ownerDetails?.name || '',
        customerMobile: ownerDetails?.mobile || '',
        orderRef,
        puppyName: dogName,
        puppyCount,
        mode,
        items: itemsToSend,
        total,
        consultFee,
        vaccinesTotal,
        freightTotal,
        assistTotal,
        insuranceTotal,
        insuranceBilling,
      }),
    }).catch(() => {})
  }, [])

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
            When your vaccines arrive, follow our step-by-step video guide. Our team is available 24/7 on WhatsApp if you have any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="accent">
              View Administration Guide
            </Button>
            <Button variant="ghostWhite">
              <Bell className="w-4 h-4" />
              Add dose reminders
            </Button>
          </div>
        </div>

        {/* Dose schedule */}
        <DoseSchedule dogName={dogName} />

        <div className="text-center">
          <Link to="/dashboard">
            <Button size="lg">
              Go to my dashboard <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-textMuted text-sm mt-4">
            Urgent? Message us on <span className="text-primary font-semibold">WhatsApp</span> (24/7)
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
