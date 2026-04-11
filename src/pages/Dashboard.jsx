import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SupportChat from '../components/SupportChat'
import {
  PawPrint, MessageSquare, Syringe, Shield, Settings, ChevronDown, ChevronRight,
  CheckCircle, Clock, AlertCircle, Loader2, Mail, ExternalLink,
  MapPin, Home, Truck, User, Activity, Heart, Leaf, CalendarDays,
  Phone, Package, Star, BadgeCheck, ArrowRight,
} from 'lucide-react'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import { supabase } from '../lib/supabase'

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Pill({ children, color = 'green' }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    slate: 'bg-slate-100 text-slate-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.slate}`}>
      {children}
    </span>
  )
}

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {Icon && <Icon size={15} className="text-slate-400" />}
          {title}
        </div>
        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
      </button>
      {open && <div className="px-4 py-4 bg-white space-y-3">{children}</div>}
    </div>
  )
}

function Row({ label, value }) {
  if (value === null || value === undefined || value === '' || value === 'unknown') return null
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
  )
}

function FlagRow({ label, value, desc }) {
  if (!value || value === 'no') return null
  return (
    <div className="text-sm space-y-0.5">
      <div className="flex items-center gap-1.5 text-amber-700 font-medium">
        <AlertCircle size={13} /> {label}
      </div>
      {desc && <p className="text-slate-600 pl-5">{desc}</p>}
    </div>
  )
}

function StatusDot({ status }) {
  if (status === 'paid' || status === 'complete') return <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle size={12} /> Paid</span>
  if (status === 'pending') return <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium"><Clock size={12} /> Pending</span>
  return null
}

function ScheduleDot({ status }) {
  if (status === 'due') return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
  if (status === 'upcoming') return <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
  return <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
}

// ─── Dog card — complete journey view ─────────────────────────────────────────

function DogCard({ dog }) {
  const p = dog.profile
  const o = dog.owner
  const h = dog.health
  const l = dog.lifestyle
  const order = dog.order
  const schedule = dog.schedule || []

  const hasHealthFlags = [
    h.known_allergies, h.current_medications, h.health_conditions,
    h.prior_vaccine_reaction, h.currently_ill, h.pregnant_or_nursing,
  ].some((v) => v && v !== 'no')

  const hasLifestyleRisk = [l.dog_parks_boarding, l.waterway_access, l.livestock_contact].some((v) => v && v !== 'no')

  const deliveryLabel = order?.deliveryMethod === 'vetpac_assist'
    ? 'VetPac Assist — in-home vaccinator'
    : order?.deliveryMethod === 'self_administer'
    ? 'Self-administer at home'
    : null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a3c2e] to-[#2d5a42] px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <PawPrint size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg leading-tight">{p.name}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {p.breed && <span className="text-white/70 text-sm">{p.breed}</span>}
            {p.ageLabel && <span className="text-white/60 text-xs">· {p.ageLabel}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {order?.status && <StatusDot status={order.status} />}
          {!order && dog.consultationStatus && (
            <Pill color="blue">{dog.consultationStatus === 'complete' ? 'Consult complete' : 'In progress'}</Pill>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* Dog profile */}
        <Section title="Dog profile" icon={PawPrint}>
          <Row label="Breed" value={p.breed} />
          <Row label="Sex" value={p.sex} />
          <Row label="Date of birth" value={p.dob ? new Date(p.dob).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
          <Row label="Weight" value={p.weight_kg ? `${p.weight_kg} kg` : null} />
          <Row label="Colour" value={p.colour} />
          <Row label="Desexed" value={p.desexed} />
          <Row label="Microchip" value={p.microchip_no} />
          {p.vaccinated_before === 'yes' && p.prior_vaccines?.length > 0 && (
            <Row label="Previous vaccines" value={p.prior_vaccines.join(', ')} />
          )}
        </Section>

        {/* Owner details */}
        <Section title="Owner details" icon={User}>
          <Row label="Name" value={o.full_name} />
          <Row label="Email" value={o.email} />
          <Row label="Phone" value={o.mobile} />
          {o.address_line1 && (
            <div className="text-sm">
              <span className="text-slate-500 block mb-0.5">Address</span>
              <span className="text-slate-800">
                {[o.address_line1, o.address_line2, o.city, o.postcode, o.region].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </Section>

        {/* Health */}
        <Section title="Health assessment" icon={Heart} defaultOpen={hasHealthFlags}>
          <Row label="Activity level" value={h.activity_level} />
          {hasHealthFlags ? (
            <div className="space-y-2 pt-1">
              <FlagRow label="Currently ill" value={h.currently_ill} desc={h.illness_description} />
              <FlagRow label="Known allergies" value={h.known_allergies} desc={h.allergy_description} />
              <FlagRow label="Current medications" value={h.current_medications} desc={h.medication_list} />
              <FlagRow label="Health conditions" value={h.health_conditions} desc={h.condition_description} />
              <FlagRow label="Prior vaccine reaction" value={h.prior_vaccine_reaction} desc={h.reaction_description} />
              <FlagRow label="Pregnant / nursing" value={h.pregnant_or_nursing} />
            </div>
          ) : (
            <p className="text-sm text-green-700 font-medium flex items-center gap-1.5"><CheckCircle size={13} /> No health concerns noted</p>
          )}
        </Section>

        {/* Lifestyle */}
        <Section title="Lifestyle & environment" icon={Leaf} defaultOpen={hasLifestyleRisk}>
          <Row label="Region" value={l.region} />
          <Row label="Living environment" value={l.living_environment} />
          {hasLifestyleRisk ? (
            <div className="space-y-1 pt-1">
              <FlagRow label="Dog parks / boarding" value={l.dog_parks_boarding} />
              <FlagRow label="Waterway access" value={l.waterway_access} />
              <FlagRow label="Livestock contact" value={l.livestock_contact} />
            </div>
          ) : (
            <p className="text-sm text-slate-500 flex items-center gap-1.5"><CheckCircle size={13} className="text-green-600" /> Low environmental risk</p>
          )}
        </Section>

        {/* Vaccination order */}
        {order ? (
          <Section title="Vaccination order" icon={Syringe}>
            <div className="flex items-center justify-between">
              <StatusDot status={order.status} />
              <span className="text-sm text-slate-500">{order.date}</span>
            </div>
            {deliveryLabel && (
              <div className="flex items-center gap-2 text-sm text-slate-700 font-medium pt-1">
                {order.deliveryMethod === 'vetpac_assist' ? <Home size={14} className="text-teal-600" /> : <Package size={14} className="text-slate-500" />}
                {deliveryLabel}
              </div>
            )}
            <div className="space-y-1 pt-2">
              {order.vaccines.map((v, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-700">
                  <span>{v.name}</span>
                  <span className="text-slate-500">${Number(v.price).toFixed(2)}</span>
                </div>
              ))}
              {order.hasFreight && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Truck size={12} />Cold-chain freight</span>
                  <span>${order.freightTotal.toFixed(2)}</span>
                </div>
              )}
              {order.hasAssist && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Home size={12} />VetPac Assist</span>
                  <span>${order.assistTotal.toFixed(2)}</span>
                </div>
              )}
              {order.warrantySelected && (
                <div className="flex justify-between text-sm text-teal-700 font-medium">
                  <span className="flex items-center gap-1"><Shield size={12} />Warranty</span>
                  <span>${order.warrantyTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-100">
                <span>Total paid</span>
                <span>${Number(order.total).toFixed(2)} NZD</span>
              </div>
            </div>
            {order.receiptUrl && (
              <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:underline pt-1">
                <ExternalLink size={13} /> View receipt
              </a>
            )}
          </Section>
        ) : (
          <Section title="Vaccination order" icon={Syringe} defaultOpen={false}>
            <p className="text-sm text-slate-500">No order placed yet.</p>
            <Link to="/plan">
              <Button size="sm" className="mt-2">View my plan <ArrowRight size={14} /></Button>
            </Link>
          </Section>
        )}

        {/* Dose schedule */}
        {schedule.length > 0 && (
          <Section title="Dose schedule" icon={CalendarDays}>
            <div className="space-y-3">
              {schedule.map((dose, i) => (
                <div key={i} className="flex items-start gap-3">
                  <ScheduleDot status={dose.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800">{dose.label}</span>
                      <span className="text-xs text-slate-500 shrink-0">{dose.date}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{dose.desc}</p>
                    {dose.status === 'due' && (
                      <Pill color="amber">Due now</Pill>
                    )}
                    {dose.status === 'upcoming' && (
                      <Pill color="blue">Within 30 days</Pill>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 mt-1">
              Schedule is indicative based on NZ vaccination protocols and your dog's date of birth.
              Always consult the enclosed VetPac guide for timing.
            </p>
          </Section>
        )}

        {/* Warranty */}
        <Section title="Warranty" icon={Shield} defaultOpen={order?.warrantySelected}>
          {order?.warrantySelected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BadgeCheck size={16} className="text-teal-600" />
                <span className="text-sm font-semibold text-teal-700">VetPac Programme Warranty active</span>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="flex items-start gap-2"><CheckCircle size={13} className="text-teal-500 mt-0.5 shrink-0" />Covers vaccine failure or adverse reactions</p>
                <p className="flex items-start gap-2"><CheckCircle size={13} className="text-teal-500 mt-0.5 shrink-0" />Covers illness contracted during the vaccination window</p>
                <p className="flex items-start gap-2"><CheckCircle size={13} className="text-teal-500 mt-0.5 shrink-0" />Valid for the duration of your puppy's programme</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                To make a claim, use the chat button with your order reference and a summary of the issue.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">No warranty on this order.</p>
              <p className="text-xs text-slate-400">Warranty can be added when placing a new order — it covers vaccine failure, adverse reactions, and illness during the vaccination window.</p>
              <Link to="/plan">
                <Button size="sm" variant="outline">Add warranty <ArrowRight size={14} /></Button>
              </Link>
            </div>
          )}
        </Section>

      </div>
    </div>
  )
}

// ─── Account tab ──────────────────────────────────────────────────────────────

function AccountTab({ session, dogs, onSwitchToDogs }) {
  const email = session?.user?.email
  const orderedDogs = dogs.filter((d) => d.order?.status === 'paid')
  const warrantiedDogs = dogs.filter((d) => d.order?.warrantySelected)

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm">Your account</h3>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <Mail size={16} className="text-slate-400 shrink-0" />
          <span>{email}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={onSwitchToDogs}
            className="text-center p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-transparent rounded-xl transition-colors"
          >
            <p className="text-2xl font-bold text-slate-800">{dogs.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Dog{dogs.length !== 1 ? 's' : ''} registered</p>
          </button>
          <button
            onClick={onSwitchToDogs}
            className="text-center p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-transparent rounded-xl transition-colors"
          >
            <p className="text-2xl font-bold text-slate-800">{orderedDogs.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Order{orderedDogs.length !== 1 ? 's' : ''} placed</p>
          </button>
          <button
            onClick={onSwitchToDogs}
            className="text-center p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-transparent rounded-xl transition-colors"
          >
            <p className="text-2xl font-bold text-slate-800">{warrantiedDogs.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Warrant{warrantiedDogs.length !== 1 ? 'ies' : 'y'} active</p>
          </button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 space-y-2">
        <p className="font-semibold text-slate-700">Need help?</p>
        <p>Use the chat button to get in touch — we respond as quickly as possible.</p>
        <p className="text-xs text-slate-400">For veterinary emergencies, contact your local vet immediately.</p>
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full text-sm text-slate-500 hover:text-red-600 transition-colors py-2"
      >
        Sign out
      </button>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

const tabs = [
  { id: 'dogs', label: 'My Dogs', icon: PawPrint },
  { id: 'account', label: 'Account', icon: Settings },
]

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dogs')
  const [data, setData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.access_token) return
    let cancelled = false
    setDataLoading(true)
    fetch('/api/dashboard-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({}),
    })
      .then((r) => {
        if (r.status === 401) { supabase.auth.signOut(); return null }
        return r.json()
      })
      .then((d) => { if (!cancelled && d) setData(d) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setDataLoading(false) })
    return () => { cancelled = true }
  }, [session])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-sm w-full text-center space-y-4">
            <PawPrint size={40} className="text-teal-600 mx-auto" />
            <h1 className="text-xl font-bold text-slate-800">Sign in to your dashboard</h1>
            <p className="text-sm text-slate-500">We'll email you a magic link — no password needed.</p>
            <MagicLinkForm />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const dogs = data?.dogs || []

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">{session.user.email}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 px-3 rounded-lg transition-all ${
                  activeTab === t.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {activeTab === 'dogs' && (
          <div className="space-y-6">
            {dataLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-teal-600" size={28} />
              </div>
            ) : dogs.length > 0 ? (
              <>
                {dogs.map((dog) => <DogCard key={dog.id} dog={dog} />)}
                <Link to="/intake" className="block">
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-400 hover:bg-teal-50 transition-colors">
                    <PawPrint size={24} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Add another dog</p>
                  </div>
                </Link>
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
                <PawPrint size={36} className="text-slate-300 mx-auto" />
                <div>
                  <p className="font-semibold text-slate-700">No records yet</p>
                  <p className="text-sm text-slate-500 mt-1">Complete the intake form to get your puppy's programme.</p>
                </div>
                <Link to="/intake">
                  <Button>Start intake form <ArrowRight size={14} /></Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <AccountTab session={session} dogs={dogs} onSwitchToDogs={() => setActiveTab('dogs')} />
        )}

      </main>
      <Footer />
      <SupportChat />
    </div>
  )
}

// ─── Magic link form (shown when not authenticated) ───────────────────────────

function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/send-dashboard-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to send link')
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="text-center space-y-2">
      <CheckCircle size={32} className="text-teal-500 mx-auto" />
      <p className="font-semibold text-slate-800">Check your email</p>
      <p className="text-sm text-slate-500">We sent a magic link to <strong>{email}</strong></p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send magic link'}
      </Button>
    </form>
  )
}
