import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PawPrint, Package, FileText, Settings, ChevronRight, Plus, Download, Calendar, AlertCircle, CheckCircle, Clock, Loader2, Mail, ArrowRight } from 'lucide-react'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { supabase } from '../lib/supabase'

const mockPuppies = [
  {
    id: '1',
    name: 'Bella',
    breed: 'Labrador Retriever',
    age: '14 weeks',
    sex: 'Female',
    nextDose: { label: 'Dose 2 — C5', date: '15 May 2026', daysUntil: 12 },
    vaccStatus: 'in_progress',
    photo: '🐕',
  },
]

const mockOrders = [
  {
    id: 'VP-A1B2C3D4',
    dog: 'Bella',
    product: 'Puppy Starter Course',
    total: 229,
    status: 'shipped',
    date: '3 Apr 2026',
    tracking: 'NZP123456789',
    doses: [
      { label: 'Dose 1 — C5', status: 'delivered', date: '5 Apr 2026' },
      { label: 'Dose 2 — C5', status: 'scheduled', date: '15 May 2026' },
      { label: 'Dose 3 — C5', status: 'scheduled', date: '12 Jun 2026' },
    ],
  },
]

const tabs = [
  { id: 'puppies', label: 'My puppies', icon: PawPrint },
  { id: 'orders', label: 'Orders & doses', icon: Package },
  { id: 'records', label: 'Health records', icon: FileText },
  { id: 'account', label: 'Account', icon: Settings },
]

function LoginGate() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | not_registered | error

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

function PuppyCard({ dog }) {
  const urgency = dog.nextDose?.daysUntil <= 7
  return (
    <Card hover className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl">{dog.photo}</div>
          <div>
            <h3 className="font-display font-bold text-xl text-textPrimary">{dog.name}</h3>
            <p className="text-textMuted text-sm">{dog.breed} • {dog.age} • {dog.sex}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-textMuted" />
      </div>

      {dog.nextDose && (
        <div className={`flex items-center gap-3 p-3 rounded-card ${urgency ? 'bg-warning/10 border border-warning/20' : 'bg-bg'}`}>
          {urgency ? <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" /> : <Clock className="w-4 h-4 text-primary flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-textPrimary">{dog.nextDose.label}</p>
            <p className="text-xs text-textMuted">Due {dog.nextDose.date} ({dog.nextDose.daysUntil} days)</p>
          </div>
          <Button size="sm" variant={urgency ? 'accent' : 'secondary'}>
            Track
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" size="sm" className="text-xs">
          <Download className="w-3.5 h-3.5" /> Certificate
        </Button>
        <Button variant="ghost" size="sm" className="text-xs">
          <Calendar className="w-3.5 h-3.5" /> Schedule
        </Button>
      </div>
    </Card>
  )
}

function OrderRow({ order }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-border rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-bg transition-colors"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono font-semibold text-textPrimary text-sm">{order.id}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-textMuted text-sm">{order.product} • {order.dog} • NZD ${order.total}</p>
          <p className="text-textMuted text-xs mt-0.5">{order.date}</p>
        </div>
        <ChevronRight className={`w-5 h-5 text-textMuted transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border p-5 bg-bg space-y-4">
          {order.tracking && (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold text-textPrimary">Tracking number</p>
                <p className="font-mono text-sm text-textMuted">{order.tracking}</p>
              </div>
              <Button size="sm" variant="secondary">Track shipment</Button>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-textPrimary mb-3">Doses</p>
            <div className="space-y-2">
              {order.doses.map((dose, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${dose.status === 'delivered' ? 'text-success' : 'text-border'}`} />
                    <span className="text-sm text-textPrimary">{dose.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-textMuted">{dose.date}</span>
                    <StatusBadge status={dose.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button variant="secondary" size="sm" fullWidth>Reorder / book booster</Button>
        </div>
      )}
    </div>
  )
}

function HealthRecordsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h3 className="font-display font-semibold text-xl text-textPrimary">Bella's health passport</h3>
          <Button size="sm" variant="secondary">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-border text-sm">
            <span className="text-textSecondary">C5 Vaccine (Dose 1)</span>
            <span className="font-mono text-textPrimary">5 Apr 2026</span>
          </div>
          <div className="flex justify-between py-3 border-b border-border text-sm">
            <span className="text-textSecondary">Vet review</span>
            <span className="font-mono text-textPrimary">4 Apr 2026</span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-textSecondary">VOI issued</span>
            <span className="font-mono text-textPrimary">4 Apr 2026</span>
          </div>
        </div>
        <div className="mt-6">
          <Button variant="secondary" size="sm">
            <FileText className="w-4 h-4" /> Share with vet / boarding facility
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('puppies')

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (mounted) {
        setSession(s)
        setAuthLoading(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Nav />
        <div className="flex flex-col items-center justify-center gap-3 pt-32 pb-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-textMuted">Loading…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginGate />
  }

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
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>

        <div className="flex items-center gap-2 border-b border-border mb-8 overflow-x-auto">
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

        {activeTab === 'puppies' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockPuppies.map((dog) => <PuppyCard key={dog.id} dog={dog} />)}
              <Link to="/intake">
                <Card hover className="flex flex-col items-center justify-center gap-3 text-center min-h-[200px] border-2 border-dashed border-border bg-transparent shadow-none hover:border-primary-light hover:bg-primary/5">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-textPrimary">Add another puppy</p>
                    <p className="text-textMuted text-sm">Start a new health intake</p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {mockOrders.map((order) => <OrderRow key={order.id} order={order} />)}
          </div>
        )}

        {activeTab === 'records' && <HealthRecordsTab />}

        {activeTab === 'account' && (
          <Card>
            <h3 className="font-display font-semibold text-xl text-textPrimary mb-6">Account</h3>
            <div className="space-y-4 text-sm text-textSecondary">
              <p>Email: <span className="text-textPrimary font-medium font-mono">{userEmail}</span></p>
              <p className="text-textMuted">Profile details will sync from your orders as we roll out account features.</p>
            </div>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  )
}
