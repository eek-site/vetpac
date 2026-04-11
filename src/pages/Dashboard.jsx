import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SupportChat from '../components/SupportChat'
import {
  PawPrint, MessageSquare, Syringe, Shield, Settings, ChevronRight, Plus,
  CheckCircle, Loader2, Mail, ArrowRight, AlertCircle, ExternalLink,
  Calendar, MapPin, Tag, Home, Truck, User, Activity,
} from 'lucide-react'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { supabase } from '../lib/supabase'

const tabs = [
  { id: 'consultation', label: 'Consultation', icon: MessageSquare },
  { id: 'vaccination', label: 'Vaccinations', icon: Syringe },
  { id: 'warranty', label: 'Warranty', icon: Shield },
  { id: 'account', label: 'Account', icon: Settings },
]

// ─── Login gate ───────────────────────────────────────────────────────────────

function LoginGate() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  const submit = async (e) => {
    e.preventDefault()
    const t = email.trim()
    if (!t) return
    setStatus('sending')
    try {
      const r = await fetch('/api/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: t }),
      })
      const j = await r.json()
      if (j.code === 'NOT_REGISTERED') setStatus('not_registered')
      else if (j.ok) setStatus('sent')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center px-4 py-16 pt-28">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">Your dashboard</h1>
            <p className="text-textSecondary text-sm">Enter the email you used for your VetPac order. We will send you a secure sign-in link.</p>
          </div>

          {status === 'sent' && (
            <div className="rounded-card-lg border border-success/30 bg-success/5 p-6 text-center mb-6">
              <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
              <p className="font-semibold text-textPrimary">Check your inbox</p>
              <p className="text-sm text-textSecondary mt-2">We sent a sign-in link to <span className="font-mono text-textPrimary">{email}</span>. Tap the button in that email to open your dashboard.</p>
            </div>
          )}

          {status === 'not_registered' && (
            <div className="rounded-card-lg border border-border bg-white p-6 mb-6">
              <p className="font-semibold text-textPrimary text-center mb-2">We could not find an account for that email</p>
              <p className="text-sm text-textSecondary text-center mb-5">Start a health plan first — then you can sign in here after you have completed an order or consultation.</p>
              <Link to="/intake" className="block">
                <Button fullWidth size="lg">
                  Start a health plan <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          )}

          {status !== 'sent' && (
            <form onSubmit={submit} className="bg-white rounded-card-lg shadow-card border border-border p-6 sm:p-8">
              <label htmlFor="dash-email" className="block text-sm font-semibold text-textPrimary mb-2">Email address</label>
              <div className="relative mb-4">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                <input
                  id="dash-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  disabled={status === 'sending'}
                  required
                />
              </div>
              {status === 'error' && (
                <p className="text-sm text-red-600 mb-3">Something went wrong. Please try again in a moment.</p>
              )}
              <Button type="submit" fullWidth size="lg" loading={status === 'sending'} disabled={status === 'sending'}>
                Email me a sign-in link
              </Button>
              <p className="text-xs text-textMuted text-center mt-4">No password — one tap from your inbox.</p>
            </form>
          )}

          {status === 'sent' && (
            <button type="button" onClick={() => { setStatus('idle'); setEmail('') }} className="w-full text-sm text-primary font-semibold mt-4 hover:underline">
              Use a different email
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cap(s) {
  if (!s) return null
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Pill({ children, variant = 'neutral' }) {
  const cls = {
    neutral: 'bg-bg border border-border text-textSecondary',
    primary: 'bg-primary/10 text-primary',
    green:   'bg-green-50 text-green-700 border border-green-200',
    amber:   'bg-amber-50 text-amber-700 border border-amber-200',
    red:     'bg-red-50 text-red-700 border border-red-200',
  }[variant] || 'bg-bg border border-border text-textSecondary'
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{children}</span>
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-textMuted uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  )
}

function DataRow({ label, value, highlight }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-sm text-textMuted shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${highlight ? 'text-amber-600' : 'text-textPrimary'}`}>{value}</span>
    </div>
  )
}

function EmptyTab({ icon: Icon, title, body, cta }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-lg text-textPrimary mb-2">{title}</h3>
      <p className="text-textMuted text-sm max-w-xs mx-auto mb-5">{body}</p>
      {cta}
    </div>
  )
}

// ─── Consultation tab ─────────────────────────────────────────────────────────

function ConsultationTab({ data, loading }) {
  const [openId, setOpenId] = useState(null)

  if (loading) return <Spinner label="Loading consultations…" />

  if (!data?.length) return (
    <EmptyTab
      icon={MessageSquare}
      title="No consultations yet"
      body="Your puppy's health consultation will appear here once you complete the intake process."
      cta={<Link to="/intake"><Button>Start consultation <ArrowRight className="w-4 h-4" /></Button></Link>}
    />
  )

  const statusLabel = { in_progress: 'In progress', complete: 'Complete', paid: 'Complete' }
  const statusVariant = { in_progress: 'amber', complete: 'green', paid: 'green' }

  return (
    <div className="space-y-4">
      {data.map((c) => {
        const open = openId === c.id
        const d = c.dog
        return (
          <div key={c.id} className="border border-border rounded-card-lg overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : c.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-bg transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <PawPrint className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-textPrimary">{d.name}</span>
                    <Pill variant={statusVariant[c.status] || 'neutral'}>{statusLabel[c.status] || c.status}</Pill>
                  </div>
                  <p className="text-sm text-textSecondary mt-0.5">
                    {[cap(d.breed), cap(d.sex), d.ageLabel].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-xs text-textMuted mt-0.5">{c.date}{c.ownerName ? ` · ${c.ownerName}` : ''}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-textMuted transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
            </button>

            {open && (
              <div className="border-t border-border px-5 pb-6 pt-5 space-y-6">

                <Section title="Dog profile">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {d.dob && <Pill variant="primary"><Calendar className="w-3 h-3" /> Born {new Date(d.dob).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</Pill>}
                    {d.desexed && d.desexed !== 'unknown' && <Pill variant="neutral">{d.desexed === 'yes' ? 'Desexed' : 'Entire'}</Pill>}
                    {d.weight_kg && <Pill variant="neutral">{d.weight_kg} kg</Pill>}
                    {d.colour && <Pill variant="neutral"><Tag className="w-3 h-3" /> {cap(d.colour)}</Pill>}
                    {d.vaccinated_before === 'yes' && <Pill variant="neutral">Previously vaccinated</Pill>}
                    {d.microchip_no && <Pill variant="neutral">Microchip: {d.microchip_no}</Pill>}
                  </div>
                  {c.lifestyle?.region && (
                    <p className="text-sm text-textSecondary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> {c.lifestyle.region}
                      {c.lifestyle.living_environment ? ` · ${cap(c.lifestyle.living_environment)}` : ''}
                    </p>
                  )}
                </Section>

                <Section title="Health assessment">
                  <div className="space-y-0">
                    <DataRow label="Activity level" value={cap(c.health?.activity_level)} />
                    <DataRow label="Currently ill" value={c.health?.currently_ill === 'yes' ? 'Yes' : 'No'} highlight={c.health?.currently_ill === 'yes'} />
                    <DataRow label="Known allergies" value={c.health?.known_allergies === 'yes' ? (c.health.allergy_description || 'Yes') : 'None'} highlight={c.health?.known_allergies === 'yes'} />
                    <DataRow label="Current medications" value={c.health?.current_medications === 'yes' ? (c.health.medication_list || 'Yes') : 'None'} highlight={c.health?.current_medications === 'yes'} />
                    <DataRow label="Health conditions" value={c.health?.health_conditions === 'yes' ? (c.health.condition_description || 'Yes') : 'None'} highlight={c.health?.health_conditions === 'yes'} />
                    <DataRow label="Prior vaccine reaction" value={c.health?.prior_vaccine_reaction === 'yes' ? 'Yes' : 'None recorded'} highlight={c.health?.prior_vaccine_reaction === 'yes'} />
                    <DataRow label="Pregnant / nursing" value={c.health?.pregnant_or_nursing === 'yes' ? 'Yes' : 'No'} highlight={c.health?.pregnant_or_nursing === 'yes'} />
                  </div>
                </Section>

                <Section title="Lifestyle risk factors">
                  <div className="flex flex-wrap gap-2">
                    {c.lifestyle?.dog_parks_boarding === 'yes' && <Pill variant="amber">Dog parks / boarding</Pill>}
                    {c.lifestyle?.waterway_access === 'yes' && <Pill variant="amber">Waterway access</Pill>}
                    {c.lifestyle?.livestock_contact === 'yes' && <Pill variant="amber">Livestock contact</Pill>}
                    {c.lifestyle?.other_dogs_household === 'yes' && <Pill variant="neutral">Other dogs in household</Pill>}
                    {c.lifestyle?.dog_parks_boarding !== 'yes' && c.lifestyle?.waterway_access !== 'yes' && c.lifestyle?.livestock_contact !== 'yes' && (
                      <span className="text-sm text-textMuted">No elevated risk factors identified</span>
                    )}
                  </div>
                </Section>

              </div>
            )}
          </div>
        )
      })}

      <Link to="/intake?fresh=1" className="block">
        <div className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-card-lg hover:border-primary hover:bg-primary/5 transition-all text-textMuted hover:text-primary">
          <Plus className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">Add another puppy</span>
        </div>
      </Link>
    </div>
  )
}

// ─── Vaccination tab ──────────────────────────────────────────────────────────

function VaccinationTab({ data, loading }) {
  const [openId, setOpenId] = useState(null)

  if (loading) return <Spinner label="Loading vaccinations…" />

  if (!data?.length) return (
    <EmptyTab
      icon={Syringe}
      title="No vaccine orders yet"
      body="Once you complete an order your vaccination plan, delivery method, and schedule will appear here."
      cta={<Link to="/plan"><Button>View my plan <ArrowRight className="w-4 h-4" /></Button></Link>}
    />
  )

  return (
    <div className="space-y-4">
      {data.map((o) => {
        const open = openId === o.sessionId
        const isAssist = o.deliveryMethod === 'vetpac_assist'
        return (
          <div key={o.sessionId} className="border border-border rounded-card-lg overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : o.sessionId)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-bg transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Syringe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-textPrimary">{o.dogName || 'Vaccine order'}</span>
                    <Pill variant="green">Confirmed</Pill>
                    {isAssist ? <Pill variant="primary"><User className="w-3 h-3" /> VetPac Assist</Pill> : <Pill variant="neutral"><Home className="w-3 h-3" /> Self-administer</Pill>}
                  </div>
                  <p className="text-sm text-textMuted mt-0.5">{o.date} · NZD ${o.total}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-textMuted transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
            </button>

            {open && (
              <div className="border-t border-border px-5 pb-6 pt-5 space-y-6">

                <Section title="Vaccines ordered">
                  <div className="space-y-0">
                    {o.vaccines.map((v, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span className="text-sm text-textPrimary">{v.name}</span>
                        </div>
                        <span className="text-sm font-medium text-textPrimary">NZD ${v.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {o.vaccines.length === 0 && <p className="text-sm text-textMuted">Vaccine details not available for this order.</p>}
                  </div>
                </Section>

                <Section title="Delivery">
                  {isAssist ? (
                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-card border border-primary/20">
                      <User className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-textPrimary text-sm">VetPac Assist — technician visits your home</p>
                        <p className="text-xs text-textSecondary mt-1">A trained vaccinator will administer all doses. NZD ${o.assistTotal?.toFixed(2)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-bg rounded-card border border-border">
                      <Truck className="w-5 h-5 text-textSecondary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-textPrimary text-sm">Self-administer — cold-chain courier delivery</p>
                        <p className="text-xs text-textSecondary mt-1">Vaccines delivered in temperature-controlled packaging with administration guide.{o.freightTotal ? ` NZD $${o.freightTotal.toFixed(2)}` : ''}</p>
                      </div>
                    </div>
                  )}
                </Section>

                <Section title="What to expect">
                  <div className="space-y-3">
                    {[
                      { step: '1', label: 'Vet review', desc: 'A licensed vet reviews your puppy\'s health profile and authorises the vaccination plan.' },
                      { step: '2', label: isAssist ? 'Booking confirmed' : 'Vaccines dispatched', desc: isAssist ? 'Your VetPac Assist technician will contact you to arrange a visit time.' : 'Cold-chain vaccines dispatched to your address with a temperature indicator strip.' },
                      { step: '3', label: isAssist ? 'Technician visits' : 'Administer at home', desc: isAssist ? 'Technician administers all vaccines and records each dose.' : 'Follow the included administration guide. Record each dose in your dashboard.' },
                      { step: '4', label: 'Health records updated', desc: 'Vaccination certificates and records will appear in your dashboard.' },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{item.step}</div>
                        <div>
                          <p className="text-sm font-semibold text-textPrimary">{item.label}</p>
                          <p className="text-xs text-textSecondary mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                {o.receiptUrl && (
                  <a href={o.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> View receipt
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Warranty tab ─────────────────────────────────────────────────────────────

function WarrantyTab({ data, loading }) {
  if (loading) return <Spinner label="Loading warranty…" />

  if (!data?.length) return (
    <EmptyTab
      icon={Shield}
      title="No warranty on file"
      body="The VetPac Programme Warranty covers vaccine failure and adverse reactions up to $5,000. Add it when placing your vaccine order."
      cta={<Link to="/plan"><Button>View my plan <ArrowRight className="w-4 h-4" /></Button></Link>}
    />
  )

  return (
    <div className="space-y-4">
      {data.map((o) => (
        <div key={o.sessionId} className="border border-border rounded-card-lg overflow-hidden bg-white shadow-sm">
          {/* Header */}
          <div className="p-5 flex items-center gap-4 border-b border-border">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-textPrimary">VetPac Programme Warranty</span>
                <Pill variant="green">Active</Pill>
              </div>
              <p className="text-sm text-textMuted mt-0.5">{o.dogName ? `${o.dogName} · ` : ''}{o.date} · NZD ${o.warrantyTotal?.toFixed(2)} paid</p>
            </div>
          </div>

          {/* Coverage */}
          <div className="px-5 pb-6 pt-5 space-y-6">
            <Section title="What's covered">
              <div className="space-y-0">
                {[
                  ['Vaccine failure', 'If the vaccine does not provide adequate immunity, repeat vaccination costs are covered.'],
                  ['Adverse reactions', 'Vet treatment costs for reactions directly caused by the administered vaccines.'],
                  ['Claim limit', 'Up to NZD $5,000 per programme.'],
                  ['Duration', 'Covers the full vaccination programme purchased.'],
                ].map(([label, desc]) => (
                  <div key={label} className="py-2.5 border-b border-border/60 last:border-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span className="text-sm font-semibold text-textPrimary">{label}</span>
                    </div>
                    <p className="text-xs text-textSecondary ml-5">{desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="What's not covered">
              <div className="space-y-1 text-sm text-textSecondary">
                {[
                  'Pre-existing conditions or illnesses present at time of vaccination',
                  'Reactions caused by failure to follow the administration guide',
                  'Injuries, accidents, or illnesses unrelated to the vaccination programme',
                  'Costs incurred more than 30 days after the final dose',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 py-1">
                    <span className="text-textMuted mt-0.5">—</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="How to make a claim">
              <div className="p-4 bg-bg rounded-card border border-border text-sm text-textSecondary space-y-1">
                <p>Email <a href="mailto:woof@vetpac.nz" className="text-primary font-medium">woof@vetpac.nz</a> with:</p>
                <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
                  <li>Your order reference number</li>
                  <li>A description of the issue</li>
                  <li>Any vet invoices or supporting documentation</li>
                </ul>
                <p className="text-xs text-textMuted mt-2">Our team will respond and guide you through the claims process.</p>
              </div>
            </Section>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Account tab ─────────────────────────────────────────────────────────────

function AccountTab({ userEmail, data, onEmailsChange }) {
  const [extraEmails, setExtraEmails] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vp_extra_emails') || '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState(null)

  const addEmail = () => {
    const e = input.trim().toLowerCase()
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setInputError('Enter a valid email address.'); return }
    if (e === userEmail.toLowerCase() || extraEmails.includes(e)) { setInputError('That email is already linked.'); return }
    const next = [...extraEmails, e]
    setExtraEmails(next)
    localStorage.setItem('vp_extra_emails', JSON.stringify(next))
    setInput('')
    setInputError(null)
    onEmailsChange(next)
  }

  const removeEmail = (e) => {
    const next = extraEmails.filter((x) => x !== e)
    setExtraEmails(next)
    localStorage.setItem('vp_extra_emails', JSON.stringify(next))
    onEmailsChange(next)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <h3 className="font-display font-semibold text-xl text-textPrimary mb-5">Account</h3>
        <div className="space-y-0 text-sm mb-5">
          <DataRow label="Sign-in email" value={userEmail} />
          <DataRow label="Consultations" value={String(data?.consultations?.length ?? '—')} />
          <DataRow label="Vaccine orders" value={String(data?.vaccinations?.length ?? '—')} />
          <DataRow label="Warranty" value={data?.warrantyOrders?.length ? 'Active' : 'Not purchased'} />
        </div>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-base text-textPrimary mb-1">Linked order emails</h3>
        <p className="text-sm text-textSecondary mb-4">
          If you paid using a different email at checkout, add it here so your orders appear in the dashboard.
        </p>

        {extraEmails.length > 0 && (
          <div className="space-y-2 mb-4">
            {extraEmails.map((e) => (
              <div key={e} className="flex items-center justify-between gap-3 px-3 py-2 bg-bg rounded-card border border-border text-sm">
                <span className="font-mono text-textSecondary">{e}</span>
                <button type="button" onClick={() => removeEmail(e)} className="text-textMuted hover:text-red-500 transition-colors text-xs">Remove</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="email"
            value={input}
            onChange={(e) => { setInput(e.target.value); setInputError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && addEmail()}
            placeholder="checkout@example.com"
            className="flex-1 px-3 py-2 border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <Button size="sm" onClick={addEmail}>Add</Button>
        </div>
        {inputError && <p className="text-xs text-red-600 mt-2">{inputError}</p>}
      </Card>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 py-14">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
      <span className="text-sm text-textMuted">{label}</span>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('consultation')
  const [data, setData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (mounted) { setSession(s); setAuthLoading(false) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session?.access_token) return
    let cancelled = false
    setDataLoading(true)
    const extraEmails = (() => { try { return JSON.parse(localStorage.getItem('vp_extra_emails') || '[]') } catch { return [] } })()
    fetch('/api/dashboard-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ extraEmails }),
    })
      .then((r) => {
        if (r.status === 401) { supabase.auth.signOut(); return null }
        return r.json()
      })
      .then((d) => { if (!cancelled && d) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDataLoading(false) })
    return () => { cancelled = true }
  }, [session])

  if (authLoading) return (
    <div className="min-h-screen bg-bg"><Nav />
      <div className="flex flex-col items-center justify-center gap-3 pt-32 pb-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-textMuted">Loading…</p>
      </div>
    </div>
  )

  if (!session) return <LoginGate />

  const userEmail = session.user?.email || ''

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <div className="max-w-content mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl text-textPrimary mb-1">My dashboard</h1>
            <p className="text-textMuted text-sm">Signed in as <span className="font-mono text-textSecondary">{userEmail}</span></p>
          </div>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>

        <div className="flex items-center gap-0 border-b border-border mb-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-all whitespace-nowrap
                  ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textPrimary'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'consultation' && <ConsultationTab data={data?.consultations} loading={dataLoading} />}
        {activeTab === 'vaccination' && <VaccinationTab data={data?.vaccinations} loading={dataLoading} />}
        {activeTab === 'warranty' && <WarrantyTab data={data?.warrantyOrders} loading={dataLoading} />}
        {activeTab === 'account' && (
          <AccountTab userEmail={userEmail} onEmailsChange={(emails) => {
            // Re-fetch data with updated emails
            setData(null)
            setDataLoading(true)
            fetch('/api/dashboard-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ extraEmails: emails }),
            })
              .then((r) => r.json())
              .then((d) => setData(d))
              .catch(() => {})
              .finally(() => setDataLoading(false))
          }} data={data} />
        )}
      </div>
      <Footer />
      <SupportChat />
    </div>
  )
}
