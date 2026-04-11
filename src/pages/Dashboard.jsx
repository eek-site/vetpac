import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PawPrint, Package, FileText, Settings, ChevronRight, Plus,
  CheckCircle, Loader2, Mail, ArrowRight, AlertCircle, ExternalLink,
} from 'lucide-react'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { supabase } from '../lib/supabase'

const tabs = [
  { id: 'orders', label: 'Orders & doses', icon: Package },
  { id: 'puppies', label: 'My puppies', icon: PawPrint },
  { id: 'records', label: 'Health records', icon: FileText },
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

// ─── Order row ────────────────────────────────────────────────────────────────

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
          <p className="text-textMuted text-sm">{order.product}{order.dog ? ` · ${order.dog}` : ''} · NZD ${order.total}</p>
          <p className="text-textMuted text-xs mt-0.5">{order.date}</p>
        </div>
        <ChevronRight className={`w-5 h-5 text-textMuted transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border p-5 bg-bg space-y-3">
          <p className="text-sm text-textMuted">Order confirmed and being processed. You will receive tracking details once your vaccines are dispatched.</p>
          <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> View receipt
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, body, cta }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-lg text-textPrimary mb-2">{title}</h3>
      <p className="text-textMuted text-sm max-w-xs mx-auto mb-5">{body}</p>
      {cta}
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(null)

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
    async function load() {
      setOrdersLoading(true)
      setOrdersError(null)
      try {
        const r = await fetch('/api/dashboard-orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        const d = await r.json()
        if (!cancelled) {
          if (d.orders) setOrders(d.orders)
          else setOrdersError('Could not load orders.')
        }
      } catch {
        if (!cancelled) setOrdersError('Could not load orders.')
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [session])

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
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>

        {/* Tab bar */}
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

        {/* Orders tab */}
        {activeTab === 'orders' && (
          <div>
            {ordersLoading && (
              <div className="flex items-center justify-center gap-3 py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-sm text-textMuted">Loading your orders…</span>
              </div>
            )}
            {!ordersLoading && ordersError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-card-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {ordersError}
              </div>
            )}
            {!ordersLoading && !ordersError && orders.length === 0 && (
              <EmptyState
                icon={Package}
                title="No orders yet"
                body="Your confirmed orders and dose schedules will appear here after you complete a vaccine order."
                cta={
                  <Link to="/intake">
                    <Button>Start a health plan <ArrowRight className="w-4 h-4" /></Button>
                  </Link>
                }
              />
            )}
            {!ordersLoading && orders.length > 0 && (
              <div className="space-y-4">
                {orders.map((order) => <OrderRow key={order.sessionId} order={order} />)}
              </div>
            )}
          </div>
        )}

        {/* Puppies tab */}
        {activeTab === 'puppies' && (
          <div>
            <EmptyState
              icon={PawPrint}
              title="Add your first puppy"
              body="Start a health intake to build a personalised vaccination plan. Your puppy's profile will appear here."
              cta={
                <Link to="/intake">
                  <Card hover className="inline-flex flex-col items-center gap-3 p-6 text-center border-2 border-dashed border-border bg-transparent shadow-none hover:border-primary hover:bg-primary/5 transition-all">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-textPrimary">Start a health intake</p>
                      <p className="text-textMuted text-sm">Takes about 5 minutes</p>
                    </div>
                  </Card>
                </Link>
              }
            />
          </div>
        )}

        {/* Health records tab */}
        {activeTab === 'records' && (
          <EmptyState
            icon={FileText}
            title="Health records"
            body="Your vaccination certificates and health records will appear here once your vet has reviewed and authorised your plan."
            cta={
              orders.length === 0 ? (
                <Link to="/intake">
                  <Button>Start a health plan <ArrowRight className="w-4 h-4" /></Button>
                </Link>
              ) : (
                <p className="text-xs text-textMuted">Your vet review is in progress. Records typically appear within 4 hours.</p>
              )
            }
          />
        )}

        {/* Account tab */}
        {activeTab === 'account' && (
          <Card>
            <h3 className="font-display font-semibold text-xl text-textPrimary mb-6">Account</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-textSecondary">Email</span>
                <span className="text-textPrimary font-medium font-mono">{userEmail}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-textSecondary">Orders</span>
                <span className="text-textPrimary font-medium">{orders.length}</span>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
                  Sign out
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  )
}
