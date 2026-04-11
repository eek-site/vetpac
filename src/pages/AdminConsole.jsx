import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Shield, LogOut, ExternalLink, LayoutDashboard, ChevronDown, ChevronRight, User, PawPrint, MessageSquare } from 'lucide-react'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'

/** Same tenant / client as EEK Graph app — override with VITE_MSAL_* in env. */
const MSAL_CDN = 'https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js'

function getMsalConfig() {
  return {
    auth: {
      clientId: import.meta.env.VITE_MSAL_CLIENT_ID || 'd67be044-6aaa-4d01-ada2-da0cc50d2034',
      authority:
        import.meta.env.VITE_MSAL_AUTHORITY ||
        'https://login.microsoftonline.com/61ffc6bc-d9ce-458b-8120-d32187c3770d',
      redirectUri: `${window.location.origin}/admin`,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: true,
    },
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load MSAL'))
    document.head.appendChild(s)
  })
}

export default function AdminConsole() {
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [account, setAccount] = useState(null)
  const [busy, setBusy] = useState(false)
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [backfillResult, setBackfillResult] = useState(null)
  const [backfillLoading, setBackfillLoading] = useState(false)
  const [intakeStats, setIntakeStats] = useState(null)
  const [intakeSessions, setIntakeSessions] = useState(null)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState(null)
  const [expandedSession, setExpandedSession] = useState(null)
  const [sessionDetail, setSessionDetail] = useState({})

  useEffect(() => {
    document.title = 'Admin — VetPac'
    let meta = document.querySelector('meta[name="robots"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    meta.content = 'noindex, nofollow'
    return () => {
      document.title = "VetPac — Your puppy's health, at home."
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await loadScript(MSAL_CDN)
        if (cancelled || !window.msal?.PublicClientApplication) throw new Error('MSAL not available')

        const pca = new window.msal.PublicClientApplication(getMsalConfig())
        if (typeof pca.initialize === 'function') await pca.initialize()
        window.__vetpacMsal = pca

        const redirect = await pca.handleRedirectPromise()
        if (cancelled) return

        if (redirect?.account) {
          pca.setActiveAccount(redirect.account)
          setAccount(redirect.account)
          setPhase('authed')
          return
        }

        const existing = pca.getActiveAccount() || pca.getAllAccounts()?.[0]
        if (existing) {
          pca.setActiveAccount(existing)
          setAccount(existing)
          setPhase('authed')
          return
        }

        setPhase('ready')
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setError(e.message || 'Authentication error')
          setPhase('error')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const getAccessToken = useCallback(async () => {
    const pca = window.__vetpacMsal
    if (!pca || !account) return null
    try {
      const r = await pca.acquireTokenSilent({
        scopes: ['User.Read'],
        account,
      })
      return r.accessToken
    } catch {
      try {
        const r = await pca.acquireTokenPopup({
          scopes: ['User.Read'],
          account,
        })
        return r.accessToken
      } catch {
        return null
      }
    }
  }, [account])

  const fetchStats = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setStatsError('Could not get a Microsoft token. Try refreshing the page or signing in again.')
      return
    }
    setStatsLoading(true)
    setStatsError(null)
    setStats(null)
    setIntakeStats(null)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/admin-site-stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin-intake-stats', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const d1 = await r1.json()
      if (!r1.ok) throw new Error(d1.error || 'Failed to load site stats')
      setStats(d1.stats)

      const d2 = await r2.json()
      if (r2.ok) setIntakeStats(d2.stats)
    } catch (e) {
      setStatsError(
        e.message ||
          'Could not load stats. Ensure Supabase migrations are applied and SUPABASE_SERVICE_ROLE_KEY is set on Vercel.'
      )
    } finally {
      setStatsLoading(false)
    }
  }, [getAccessToken])

  const fetchSessions = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return
    setSessionsLoading(true)
    setSessionsError(null)
    try {
      const r = await fetch('/api/admin-intake-sessions', { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to load sessions')
      setIntakeSessions(d.sessions || [])
    } catch (e) {
      setSessionsError(e.message || 'Could not load intake sessions')
    } finally {
      setSessionsLoading(false)
    }
  }, [getAccessToken])

  const loadSessionDetail = useCallback(async (sessionToken) => {
    if (sessionDetail[sessionToken]) return
    const msToken = await getAccessToken()
    if (!msToken) return
    try {
      const r = await fetch(`/api/admin-intake-sessions?id=${encodeURIComponent(sessionToken)}`, {
        headers: { Authorization: `Bearer ${msToken}` },
      })
      const d = await r.json()
      if (r.ok && d.session) {
        setSessionDetail((prev) => ({ ...prev, [sessionToken]: d.session }))
      }
    } catch { /* silent */ }
  }, [getAccessToken, sessionDetail])

  useEffect(() => {
    if (phase !== 'authed' || !account) return
    void fetchStats()
    void fetchSessions()
  }, [phase, account, fetchStats, fetchSessions])

  const signIn = async () => {
    const pca = window.__vetpacMsal
    if (!pca) {
      setError('Auth not ready — refresh the page.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await pca.loginRedirect({
        scopes: ['openid', 'profile', 'User.Read'],
        prompt: 'select_account',
      })
    } catch (e) {
      console.error(e)
      setError(e.message || 'Sign-in failed')
      setBusy(false)
    }
  }

  const runStripeBackfill = async () => {
    const token = await getAccessToken()
    if (!token) {
      setStatsError('Could not get a Microsoft token. Try signing in again.')
      return
    }
    setBackfillLoading(true)
    setBackfillResult(null)
    try {
      const r = await fetch('/api/backfill-stripe-events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Backfill failed')
      setBackfillResult(data)
      await fetchStats()
    } catch (e) {
      setStatsError(e.message || 'Backfill failed')
    } finally {
      setBackfillLoading(false)
    }
  }

  const signOut = async () => {
    const pca = window.__vetpacMsal
    setAccount(null)
    setPhase('ready')
    if (pca) {
      try {
        await pca.logoutRedirect({
          postLogoutRedirectUri: `${window.location.origin}/admin`,
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-textMuted">Loading admin…</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 text-center">
        <p className="text-textPrimary font-semibold mb-2">Could not load sign-in</p>
        <p className="text-sm text-textMuted mb-6">{error}</p>
        <Link to="/" className="text-primary font-semibold hover:underline">
          Back to site
        </Link>
      </div>
    )
  }

  if (phase === 'ready' || !account) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <header className="border-b border-border bg-white px-4 py-4">
          <Link to="/" className="font-display font-bold text-xl text-primary">
            VetPac
          </Link>
          <span className="ml-3 text-xs font-semibold text-textMuted uppercase tracking-wide">Admin</span>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md bg-white rounded-card-lg shadow-card border border-border p-8 text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="font-display font-bold text-2xl text-textPrimary mb-2">VetPac admin</h1>
            <p className="text-sm text-textSecondary mb-8">
              Sign in with your Microsoft work account (same tenant as Forman Pacific).
            </p>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <Button fullWidth size="lg" onClick={signIn} loading={busy} disabled={busy}>
              Sign in with Microsoft
            </Button>
            <Link to="/" className="inline-block mt-6 text-sm text-primary font-medium hover:underline">
              ← Back to vetpac.nz
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const displayName = account.name || account.username || 'Admin'
  const email = account.username || ''

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border bg-white px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display font-bold text-xl text-primary">
            VetPac
          </Link>
          <span className="text-xs font-semibold text-textMuted uppercase tracking-wide px-2 py-1 bg-bg rounded-full">
            Admin console
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-textSecondary hidden sm:inline font-mono truncate max-w-[200px]">{email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-textPrimary mb-1">
            Welcome, {displayName.split(' ')[0]}
          </h2>
          <p className="text-sm text-textMuted">Signed in as {email}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="https://vetpac.nz/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-5 bg-white rounded-card-lg border border-border shadow-sm hover:border-primary/40 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-textPrimary group-hover:text-primary flex items-center gap-1">
                Customer dashboard <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </p>
            </div>
          </a>

          <Link
            to="/"
            className="flex items-start gap-4 p-5 bg-white rounded-card-lg border border-border shadow-sm hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg" aria-hidden>
                🏠
              </span>
            </div>
            <div>
              <p className="font-semibold text-textPrimary">Marketing site</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-card-lg border border-border p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-textPrimary">Analytics</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => void fetchStats()}
                loading={statsLoading}
                disabled={statsLoading}
              >
                Refresh
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void runStripeBackfill()}
                loading={backfillLoading}
                disabled={backfillLoading || statsLoading}
              >
                Backfill from Stripe
              </Button>
            </div>
          </div>

          {statsLoading && (
            <div className="flex items-center gap-2 text-sm text-textSecondary py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
              Loading metrics…
            </div>
          )}

          {statsError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{statsError}</p>
          )}
          {backfillResult && (
            <p className="text-sm text-textSecondary">
              Stripe backfill: inserted {backfillResult.inserted}, skipped {backfillResult.skipped} (duplicates or unpaid), scanned {backfillResult.pages} page(s).
            </p>
          )}
          {intakeStats && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Intake chat</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm text-textSecondary">
                <div>
                  <span className="text-textMuted text-xs block">Sessions yesterday (NZ)</span>
                  <span className="font-bold text-textPrimary text-lg">{intakeStats.distinct_sessions_yesterday_nz}</span>
                </div>
                <div>
                  <span className="text-textMuted text-xs block">Messages yesterday (NZ)</span>
                  <span className="font-bold text-textPrimary text-lg">{intakeStats.messages_yesterday_nz}</span>
                </div>
                <div>
                  <span className="text-textMuted text-xs block">Sessions today (NZ)</span>
                  <span className="font-bold text-textPrimary text-lg">{intakeStats.distinct_sessions_today_nz}</span>
                </div>
                <div>
                  <span className="text-textMuted text-xs block">Sessions last 7d (NZ)</span>
                  <span className="font-bold text-textPrimary text-lg">{intakeStats.distinct_sessions_last_7_days_nz}</span>
                </div>
              </div>
            </div>
          )}
          {stats && (
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-bg rounded-lg p-4 border border-border">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Site events — today (NZ)</p>
                <pre className="text-xs text-textPrimary whitespace-pre-wrap font-mono overflow-x-auto">
                  {JSON.stringify(stats.counts_today_nz, null, 2)}
                </pre>
              </div>
              <div className="bg-bg rounded-lg p-4 border border-border">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Site events — yesterday (NZ)</p>
                <pre className="text-xs text-textPrimary whitespace-pre-wrap font-mono overflow-x-auto">
                  {JSON.stringify(stats.counts_yesterday_nz, null, 2)}
                </pre>
              </div>
              <div className="bg-bg rounded-lg p-4 border border-border">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Site events — last 7 days (NZ)</p>
                <p className="text-lg font-bold text-primary mb-1">{stats.totals_last_7_days_nz} events</p>
                <pre className="text-xs text-textPrimary whitespace-pre-wrap font-mono overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(stats.counts_last_7_days_nz, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* ── Intake sessions ─────────────────────────────────────────── */}
        <div className="bg-white rounded-card-lg border border-border p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-textPrimary">Intake sessions</h3>
              <p className="text-xs text-textMuted mt-0.5">Every chat session — structured data, owner details, and full conversation.</p>
            </div>
            <Button type="button" size="sm" onClick={() => void fetchSessions()} loading={sessionsLoading} disabled={sessionsLoading}>
              Refresh
            </Button>
          </div>

          {sessionsLoading && (
            <div className="flex items-center gap-2 text-sm text-textSecondary py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" /> Loading sessions…
            </div>
          )}
          {sessionsError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{sessionsError}</p>
          )}

          {intakeSessions && intakeSessions.length === 0 && (
            <p className="text-sm text-textMuted py-4 text-center">No sessions yet — they will appear here once the DB migration is applied.</p>
          )}

          {intakeSessions && intakeSessions.length > 0 && (
            <div className="space-y-2">
              {intakeSessions.map((s) => {
                const isExpanded = expandedSession === s.session_token
                const detail = sessionDetail[s.session_token]
                const owner = s.owner_details || {}
                const dogName = s.dog_name || s.dog_profile?.name || '—'
                const ownerName = owner.full_name || owner.name || '—'
                const email = s.email || owner.email || '—'
                const date = new Date(s.created_at).toLocaleString('en-NZ', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', timeZone: 'Pacific/Auckland',
                })

                return (
                  <div key={s.session_token} className="border border-border rounded-card overflow-hidden">
                    <button
                      type="button"
                      className="w-full text-left p-4 hover:bg-bg transition-colors flex items-center gap-3"
                      onClick={() => {
                        if (!isExpanded) loadSessionDetail(s.session_token)
                        setExpandedSession(isExpanded ? null : s.session_token)
                      }}
                    >
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-textMuted flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-textMuted flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-semibold text-textPrimary text-sm flex items-center gap-1">
                            <PawPrint className="w-3.5 h-3.5 text-primary" /> {dogName}
                          </span>
                          {ownerName !== '—' && (
                            <span className="text-textMuted text-xs flex items-center gap-1">
                              <User className="w-3 h-3" /> {ownerName}
                            </span>
                          )}
                          {email !== '—' && (
                            <a href={`mailto:${email}`} className="text-primary text-xs hover:underline" onClick={(e) => e.stopPropagation()}>
                              {email}
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-textMuted">{date} · NZ</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border bg-bg p-4 space-y-4">
                        {!detail && (
                          <div className="flex items-center gap-2 text-xs text-textMuted">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
                          </div>
                        )}
                        {detail && (
                          <>
                            {/* Structured data */}
                            <div className="grid sm:grid-cols-2 gap-4">
                              {detail.dog_profile && Object.keys(detail.dog_profile).length > 0 && (
                                <div className="bg-white rounded-card border border-border p-3">
                                  <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <PawPrint className="w-3 h-3" /> Dog profile
                                  </p>
                                  <dl className="space-y-1">
                                    {Object.entries(detail.dog_profile).map(([k, v]) => (
                                      <div key={k} className="flex gap-2 text-xs">
                                        <dt className="text-textMuted capitalize w-24 flex-shrink-0">{k.replace(/_/g, ' ')}</dt>
                                        <dd className="text-textPrimary font-medium truncate">{String(v)}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                </div>
                              )}
                              {detail.owner_details && Object.keys(detail.owner_details).length > 0 && (
                                <div className="bg-white rounded-card border border-border p-3">
                                  <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <User className="w-3 h-3" /> Owner details
                                  </p>
                                  <dl className="space-y-1">
                                    {Object.entries(detail.owner_details).map(([k, v]) => (
                                      <div key={k} className="flex gap-2 text-xs">
                                        <dt className="text-textMuted capitalize w-24 flex-shrink-0">{k.replace(/_/g, ' ')}</dt>
                                        <dd className="text-textPrimary font-medium truncate">{String(v)}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                </div>
                              )}
                            </div>

                            {/* AI assessment flags */}
                            {detail.ai_assessment?.flags?.length > 0 && (
                              <div className="bg-warning/5 border border-warning/20 rounded-card p-3">
                                <p className="text-xs font-semibold text-amber-700 mb-1.5">AI flags</p>
                                <ul className="space-y-1">
                                  {detail.ai_assessment.flags.map((f, i) => (
                                    <li key={i} className="text-xs text-amber-600">• {f}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Conversation */}
                            {detail.messages?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" /> Conversation ({detail.messages.length} messages)
                                </p>
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                  {detail.messages.map((m, i) => {
                                    const text = m.content.replace(/INTAKE_COMPLETE:\{[\s\S]*\}/, '').trim()
                                    if (!text) return null
                                    return (
                                      <div key={i} className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${
                                        m.role === 'user'
                                          ? 'ml-auto bg-primary/10 text-primary border border-primary/20'
                                          : 'bg-white border border-border text-textSecondary'
                                      }`}>
                                        <span className="font-semibold block mb-0.5 text-textMuted">{m.role === 'user' ? 'Owner' : 'VetPac AI'}</span>
                                        <span className="whitespace-pre-wrap">{text}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
