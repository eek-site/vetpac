import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Shield, LogOut, ExternalLink, LayoutDashboard, ChevronDown, ChevronRight, User, PawPrint, MessageSquare, Globe, Monitor, Smartphone, RefreshCw, Mail, Send, X } from 'lucide-react'
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

const EVENT_LABELS = {
  intake_page_view:          { label: 'Intake views',        emoji: '👀' },
  intake_user_message:       { label: 'Chat messages',       emoji: '💬' },
  intake_completed:          { label: 'Intakes completed',   emoji: '✅' },
  treatment_plan_generated:  { label: 'Plans generated',     emoji: '📋' },
  checkout_started:          { label: 'Checkouts started',   emoji: '🛒' },
  checkout_completed:        { label: 'Orders placed',       emoji: '🎉' },
  contact_ai_message:        { label: 'Contact chats',       emoji: '🤝' },
  plan_page_view:            { label: 'Plan page views',     emoji: '📄' },
  dashboard_view:            { label: 'Dashboard views',     emoji: '📊' },
}

function EventRow({ event, today, yesterday, week }) {
  const { label, emoji } = EVENT_LABELS[event] || { label: event.replace(/_/g, ' '), emoji: '•' }
  const weekVal = week || 0
  if (!today && !yesterday && !weekVal) return null
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-4 text-sm text-textPrimary flex items-center gap-2">
        <span className="text-base leading-none">{emoji}</span>
        <span className="capitalize">{label}</span>
      </td>
      <td className="py-2.5 px-3 text-center text-sm font-semibold text-textPrimary">{today || 0}</td>
      <td className="py-2.5 px-3 text-center text-sm font-medium text-textSecondary">{yesterday || 0}</td>
      <td className="py-2.5 pl-3 text-center text-sm font-medium text-textMuted">{weekVal}</td>
    </tr>
  )
}

function SiteEventStats({ stats }) {
  const today = stats.counts_today_nz || {}
  const yesterday = stats.counts_yesterday_nz || {}
  const week = stats.counts_last_7_days_nz || {}
  const allKeys = [...new Set([...Object.keys(today), ...Object.keys(yesterday), ...Object.keys(week)])]
    .sort((a, b) => (week[b] || 0) - (week[a] || 0))

  if (allKeys.length === 0) return (
    <p className="text-sm text-textMuted text-center py-3">No events recorded yet.</p>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-2 text-xs font-semibold text-textMuted uppercase tracking-wide">Event</th>
            <th className="pb-2 px-3 text-center text-xs font-semibold text-primary uppercase tracking-wide">Today</th>
            <th className="pb-2 px-3 text-center text-xs font-semibold text-textMuted uppercase tracking-wide">Yesterday</th>
            <th className="pb-2 pl-3 text-center text-xs font-semibold text-textMuted uppercase tracking-wide">7 days</th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map(k => (
            <EventRow key={k} event={k} today={today[k]} yesterday={yesterday[k]} week={week[k]} />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border">
            <td className="pt-2.5 text-xs font-semibold text-textMuted">Total events</td>
            <td className="pt-2.5 px-3 text-center text-sm font-bold text-primary">
              {Object.values(today).reduce((a, b) => a + b, 0)}
            </td>
            <td className="pt-2.5 px-3 text-center text-sm font-semibold text-textSecondary">
              {Object.values(yesterday).reduce((a, b) => a + b, 0)}
            </td>
            <td className="pt-2.5 pl-3 text-center text-sm font-semibold text-textMuted">
              {stats.totals_last_7_days_nz || 0}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── Conversation Inbox ───────────────────────────────────────────────────────

const REPLIED_KEY = 'vetpac_admin_replied_v1'
function getReplied() {
  try { return new Set(JSON.parse(localStorage.getItem(REPLIED_KEY) || '[]')) } catch { return new Set() }
}
function markReplied(token) {
  const s = getReplied(); s.add(token)
  localStorage.setItem(REPLIED_KEY, JSON.stringify([...s]))
}

function ConversationInbox({ sessions, sessionDetail, loadDetail, msToken, getToken }) {
  const [active, setActive]       = useState(null)
  const [draft, setDraft]         = useState('')
  const [rewriting, setRewriting] = useState(false)
  const [rewritten, setRewritten] = useState(null)
  const [sending, setSending]     = useState(false)
  const [sentSet, setSentSet]     = useState(() => getReplied())
  const [error, setError]         = useState(null)
  const bottomRef = useRef(null)

  const withEmail = (sessions || []).filter(s => {
    const email = s.email || s.owner_details?.email
    return !!email
  })
  const needsReply = withEmail.filter(s => !sentSet.has(s.session_token))
  const replied    = withEmail.filter(s =>  sentSet.has(s.session_token))

  const open = (s) => {
    setActive(s.session_token)
    setDraft(''); setRewritten(null); setError(null)
    loadDetail(s.session_token)
  }

  useEffect(() => {
    if (active) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [active, sessionDetail])

  const rewrite = async () => {
    if (!draft.trim()) return
    const session = withEmail.find(s => s.session_token === active)
    const detail  = sessionDetail[active]
    const owner   = session?.owner_details || {}
    const dogName = session?.dog_name || detail?.dog_profile?.name || ''
    const convo   = (detail?.messages || [])
      .filter(m => m.role !== 'system')
      .slice(-8)
      .map(m => `${m.role === 'user' ? 'Customer' : 'VetPac AI'}: ${m.content.replace(/INTAKE_COMPLETE:[\s\S]*/,'').trim()}`)
      .filter(Boolean)
      .join('\n')

    const token = msToken || await getToken()
    setRewriting(true); setError(null)
    try {
      const r = await fetch('/api/admin-rewrite-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          draft,
          customerName: owner.full_name || owner.name || '',
          dogName,
          conversationSummary: convo,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setRewritten(d.text)
    } catch (e) { setError(e.message) }
    finally { setRewriting(false) }
  }

  const sendReply = async () => {
    const session = withEmail.find(s => s.session_token === active)
    const owner   = session?.owner_details || {}
    const toEmail = session?.email || owner.email
    const toName  = owner.full_name || owner.name || ''
    const dogName = session?.dog_name || sessionDetail[active]?.dog_profile?.name || 'your puppy'
    const body    = rewritten || draft
    const token   = msToken || await getToken()
    setSending(true); setError(null)
    try {
      const r = await fetch('/api/admin-send-customer-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to: toEmail, toName,
          subject: `Your VetPac programme — ${dogName}`,
          message: body,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      markReplied(active)
      setSentSet(getReplied())
      setDraft(''); setRewritten(null); setActive(null)
    } catch (e) { setError(e.message) }
    finally { setSending(false) }
  }

  if (withEmail.length === 0) return (
    <p className="text-sm text-textMuted text-center py-6">No sessions with customer email addresses yet.</p>
  )

  return (
    <div className="flex gap-0 border border-border rounded-xl overflow-hidden" style={{ minHeight: 480 }}>

      {/* Left — conversation list */}
      <div className="w-64 flex-shrink-0 border-r border-border flex flex-col bg-bg">
        {needsReply.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Needs reply ({needsReply.length})
            </p>
          </div>
        )}
        {needsReply.map(s => <ConvoRow key={s.session_token} s={s} active={active} onClick={open} badge="reply" />)}

        {replied.length > 0 && (
          <div className="px-3 pt-3 pb-1 mt-1 border-t border-border">
            <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Replied ({replied.length})</p>
          </div>
        )}
        {replied.map(s => <ConvoRow key={s.session_token} s={s} active={active} onClick={open} badge="done" />)}
      </div>

      {/* Right — conversation thread + compose */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-textMuted text-sm">
            ← Select a conversation
          </div>
        ) : (() => {
          const session = withEmail.find(s => s.session_token === active)
          const detail  = sessionDetail[active]
          const owner   = session?.owner_details || {}
          const dogName = session?.dog_name || detail?.dog_profile?.name || '—'
          const toEmail = session?.email || owner.email
          const toName  = owner.full_name || owner.name || ''
          const messages = (detail?.messages || []).filter(m => m.role !== 'system')

          return (
            <>
              {/* Thread header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg">
                <div>
                  <p className="font-semibold text-textPrimary text-sm flex items-center gap-1.5">
                    <PawPrint className="w-3.5 h-3.5 text-primary" /> {dogName}
                    {toName && <span className="text-textMuted font-normal">· {toName}</span>}
                  </p>
                  <a href={`mailto:${toEmail}`} className="text-xs text-primary hover:underline">{toEmail}</a>
                </div>
                <button onClick={() => setActive(null)} className="text-textMuted hover:text-textPrimary">
                  <X size={15} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {!detail && (
                  <div className="flex items-center gap-2 text-xs text-textMuted py-4 justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading conversation…
                  </div>
                )}
                {messages.map((m, i) => {
                  const text = m.content
                    .replace(/INTAKE_COMPLETE:[\s\S]*/, '')
                    .replace('[INTAKE_COMPLETE_REDACTED]', '')
                    .trim()
                  if (!text) return null
                  const isUser = m.role === 'user'
                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-[#1a3c2e] text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                      }`}>
                        <span className={`block font-semibold mb-0.5 text-[10px] ${isUser ? 'text-white/60' : 'text-slate-400'}`}>
                          {isUser ? (toName || 'Customer') : 'VetPac AI'}
                        </span>
                        {text}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose area */}
              <div className="border-t border-border px-4 py-3 bg-bg space-y-2">
                {sentSet.has(active) && (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span>✓</span> You replied to this conversation
                  </p>
                )}
                <p className="text-[10px] font-semibold text-textMuted uppercase tracking-wider">Your reply to {toName || toEmail}</p>
                <textarea
                  value={draft}
                  onChange={e => { setDraft(e.target.value); setRewritten(null) }}
                  placeholder="Type a draft reply…"
                  rows={3}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />

                {rewritten && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI rewrite — review and edit:</p>
                    <textarea
                      value={rewritten}
                      onChange={e => setRewritten(e.target.value)}
                      rows={5}
                      className="w-full text-sm border-2 border-primary/30 rounded-xl px-3 py-2 bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                )}

                {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">{error}</p>}

                <div className="flex items-center gap-2">
                  <button
                    onClick={rewrite}
                    disabled={!draft.trim() || rewriting}
                    className="flex items-center gap-1.5 text-xs bg-white border border-border hover:border-primary text-textSecondary hover:text-primary font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-40"
                  >
                    {rewriting ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>✨</span>}
                    {rewriting ? 'Rewriting…' : 'Rewrite with AI'}
                  </button>
                  <Button
                    size="sm"
                    onClick={sendReply}
                    loading={sending}
                    disabled={sending || (!draft.trim() && !rewritten?.trim())}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sentSet.has(active) ? 'Send again' : 'Send email'}
                  </Button>
                </div>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}

function ConvoRow({ s, active, onClick, badge }) {
  const owner   = s.owner_details || {}
  const dogName = s.dog_name || '—'
  const name    = owner.full_name || owner.name || '—'
  const isActive = active === s.session_token
  const timeAgo = (() => {
    const ms = Date.now() - new Date(s.created_at).getTime()
    if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`
    if (ms < 86400000) return `${Math.round(ms / 3600000)}h ago`
    return `${Math.round(ms / 86400000)}d ago`
  })()
  return (
    <button
      type="button"
      onClick={() => onClick(s)}
      className={`w-full text-left px-3 py-2.5 hover:bg-white transition-colors border-l-2 ${
        isActive ? 'bg-white border-primary' : 'border-transparent'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="font-semibold text-xs text-textPrimary truncate flex items-center gap-1">
          <PawPrint className="w-3 h-3 text-primary flex-shrink-0" /> {dogName}
        </span>
        <span className="text-[10px] text-textMuted flex-shrink-0">{timeAgo}</span>
      </div>
      <p className="text-[11px] text-textMuted truncate">{name}</p>
      {badge === 'reply' && (
        <span className="inline-block mt-1 text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          Needs reply
        </span>
      )}
      {badge === 'done' && (
        <span className="inline-block mt-1 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          ✓ Replied
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function ReplyModal({ session, msToken, onClose }) {
  const owner   = session.owner_details || {}
  const dogName = session.dog_name || session.dog_profile?.name || 'your puppy'
  const toEmail = session.email || owner.email || ''
  const toName  = owner.full_name || owner.name || ''

  const defaultSubject = `Your VetPac intake — ${dogName}`
  const defaultMessage = `Hi ${toName.split(' ')[0] || 'there'},\n\nThank you for completing your VetPac intake for ${dogName}.\n\nWe've reviewed your submission and will be in touch shortly with your personalised vaccination plan.\n\nIn the meantime, feel free to reply to this email or use the chat at vetpac.nz if you have any questions.\n\nThe VetPac team`

  const [subject, setSubject]   = useState(defaultSubject)
  const [body, setBody]         = useState(defaultMessage)
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState(null)

  const send = async () => {
    if (!toEmail) { setError('No email address for this customer'); return }
    setSending(true); setError(null)
    try {
      const r = await fetch('/api/admin-send-customer-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${msToken}` },
        body: JSON.stringify({ to: toEmail, toName, subject, message: body }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Send failed')
      setSent(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-semibold text-textPrimary flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Reply to customer
            </p>
            <p className="text-xs text-textMuted mt-0.5">
              {toName && <span className="font-medium text-textSecondary">{toName} · </span>}
              <a href={`mailto:${toEmail}`} className="text-primary hover:underline">{toEmail || '— no email —'}</a>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-bg flex items-center justify-center text-textMuted hover:text-textPrimary transition-colors">
            <X size={16} />
          </button>
        </div>

        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <p className="font-semibold text-textPrimary">Email sent</p>
            <p className="text-sm text-textMuted">Delivered to {toEmail}</p>
            <button onClick={onClose} className="mt-2 text-sm text-primary font-medium hover:underline">Close</button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wide block mb-1">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wide block mb-1">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono leading-relaxed"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          </div>
        )}

        {!sent && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
            <p className="text-xs text-textMuted">Sends from VetPac · replies go to your inbox</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={send} loading={sending} disabled={sending || !toEmail}>
                <Send className="w-3.5 h-3.5" /> Send email
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
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
  const [intakeBackfillLoading, setIntakeBackfillLoading] = useState(false)
  const [intakeBackfillResult, setIntakeBackfillResult] = useState(null)
  const [visitors, setVisitors] = useState(null)
  const [visitorsLoading, setVisitorsLoading] = useState(false)
  const [visitorsError, setVisitorsError] = useState(null)
  const [expandedVisitor, setExpandedVisitor] = useState(null)
  const [replySession, setReplySession] = useState(null)
  const [msTokenCache, setMsTokenCache] = useState(null)
  const sessionsRef = useRef(null)

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
    setMsTokenCache(token)
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

  const runIntakeBackfill = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return
    setIntakeBackfillLoading(true)
    setIntakeBackfillResult(null)
    try {
      const r = await fetch('/api/backfill-intake-sessions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Backfill failed')
      setIntakeBackfillResult(d)
      void fetchSessions()
    } catch (e) {
      setSessionsError(e.message || 'Backfill failed')
    } finally {
      setIntakeBackfillLoading(false)
    }
  }, [getAccessToken, fetchSessions])

  const fetchVisitors = useCallback(async () => {
    setVisitorsLoading(true)
    setVisitorsError(null)
    try {
      const r = await fetch('/api/visitors?limit=100')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to load visitors')
      setVisitors(d.visitors || [])
    } catch (e) {
      setVisitorsError(e.message || 'Could not load visitors')
    } finally {
      setVisitorsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'authed' || !account) return
    void fetchStats()
    void fetchSessions()
    void fetchVisitors()
  }, [phase, account, fetchStats, fetchSessions, fetchVisitors])

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
              VetPac staff and vet portal access only.
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

        {/* ── Conversations inbox ─────────────────────────────────────── */}
        <div className="bg-white rounded-card-lg border border-border p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-textPrimary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Conversations
                {intakeSessions && intakeSessions.filter(s => (s.email || s.owner_details?.email)).length > 0 && (() => {
                  const replied = getReplied()
                  const unreplied = intakeSessions.filter(s => (s.email || s.owner_details?.email) && !replied.has(s.session_token)).length
                  return unreplied > 0
                    ? <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{unreplied} need reply</span>
                    : null
                })()}
              </h3>
              <p className="text-xs text-textMuted mt-0.5">Intake chat sessions — view the full conversation, draft a reply, AI rewrites it.</p>
            </div>
            <Button type="button" size="sm" onClick={() => void fetchSessions()} loading={sessionsLoading} disabled={sessionsLoading}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
          {sessionsLoading && (
            <div className="flex items-center gap-2 text-sm text-textSecondary py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" /> Loading…
            </div>
          )}
          {!sessionsLoading && (
            <ConversationInbox
              sessions={intakeSessions}
              sessionDetail={sessionDetail}
              loadDetail={loadSessionDetail}
              msToken={msTokenCache}
              getToken={getAccessToken}
            />
          )}
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
                {[
                  { label: 'Sessions yesterday (NZ)', value: intakeStats.distinct_sessions_yesterday_nz },
                  { label: 'Messages yesterday (NZ)', value: intakeStats.messages_yesterday_nz },
                  { label: 'Sessions today (NZ)', value: intakeStats.distinct_sessions_today_nz },
                  { label: 'Sessions last 7d (NZ)', value: intakeStats.distinct_sessions_last_7_days_nz },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => sessionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="text-left rounded-lg hover:bg-primary/10 transition-colors p-1 -m-1 group"
                  >
                    <span className="text-textMuted text-xs block">{label}</span>
                    <span className="font-bold text-textPrimary text-lg group-hover:text-primary transition-colors underline decoration-dashed underline-offset-2 decoration-primary/40">
                      {value}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-primary/60 mt-2">↓ Click any number to jump to full session list below</p>
            </div>
          )}
          {stats && <SiteEventStats stats={stats} />}
        </div>

        {/* ── Visitors ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-card-lg border border-border p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-textPrimary">Visitors</h3>
              <p className="text-xs text-textMuted mt-0.5">Real-time website visitors — source, journey, and intent signals.</p>
            </div>
            <Button type="button" size="sm" onClick={() => void fetchVisitors()} loading={visitorsLoading} disabled={visitorsLoading}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>

          {visitorsLoading && (
            <div className="flex items-center gap-2 text-sm text-textSecondary py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" /> Loading visitors…
            </div>
          )}
          {visitorsError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {visitorsError}
              {visitorsError.includes('KV') || visitorsError.includes('fetch') ? ' — ensure KV_REST_API_URL and KV_REST_API_TOKEN are set on Vercel.' : ''}
            </p>
          )}

          {visitors && visitors.length === 0 && (
            <p className="text-sm text-textMuted py-4 text-center">No visitors recorded yet — tracking will populate as visitors land on the site.</p>
          )}

          {visitors && visitors.length > 0 && (() => {
            const today = new Date().toDateString()
            const todayCount = visitors.filter(v => new Date(v.createdAt).toDateString() === today).length
            const highIntent = visitors.filter(v => v.hasHighIntent || (v.currentSession?.bookingClicks > 0)).length
            const returning = visitors.filter(v => v.metrics?.isReturning || v.historyMetrics?.isReturning).length
            const engaged = visitors.filter(v => v.metrics?.isEngaged || v.currentSession?.isEngaged).length

            return (
              <>
                {/* Summary bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Today', value: todayCount },
                    { label: 'Total', value: visitors.length },
                    { label: 'High intent', value: highIntent, highlight: true },
                    { label: 'Engaged', value: engaged },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className={`rounded-lg p-3 border ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-bg border-border'}`}>
                      <p className={`text-xs font-medium mb-1 ${highlight ? 'text-amber-700' : 'text-textMuted'}`}>{label}</p>
                      <p className={`text-xl font-bold ${highlight ? 'text-amber-800' : 'text-textPrimary'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Visitor list */}
                <div className="space-y-2">
                  {visitors.map((v) => {
                    const isExpanded = expandedVisitor === v.id
                    const source = (() => {
                      const s = v.source || {}
                      if (s.gclid || s.gbraid || s.wbraid) return { label: 'Google Ads', emoji: '🔵' }
                      if (s.fbclid) return { label: 'Facebook Ads', emoji: '📘' }
                      if (s.utmSource) return { label: s.utmSource, emoji: '🏷️' }
                      if (s.referrer) {
                        try {
                          const h = new URL(s.referrer).hostname
                          if (h.includes('google')) return { label: 'Google Search', emoji: '🔍' }
                          if (h.includes('bing')) return { label: 'Bing Search', emoji: '🔍' }
                          if (h.includes('facebook')) return { label: 'Facebook', emoji: '📘' }
                          return { label: h, emoji: '🔗' }
                        } catch { return { label: 'Referral', emoji: '🔗' } }
                      }
                      return { label: 'Direct', emoji: '🎯' }
                    })()

                    const locationStr = [v.location?.city, v.location?.region].filter(Boolean).join(', ') || null
                    const timeAgo = (() => {
                      const ms = Date.now() - new Date(v.updatedAt || v.createdAt).getTime()
                      if (ms < 60000) return `${Math.round(ms / 1000)}s ago`
                      if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`
                      if (ms < 86400000) return `${Math.round(ms / 3600000)}h ago`
                      return `${Math.round(ms / 86400000)}d ago`
                    })()

                    const pageViews = Array.isArray(v.pageViews) ? v.pageViews : []
                    const intentSignals = v.currentSession?.intentSignals || []
                    const isHighIntent = v.hasHighIntent || intentSignals.some(s => s.includes('booking') || s.includes('plan') || s.includes('checkout'))

                    return (
                      <div key={v.id} className="border border-border rounded-card overflow-hidden">
                        <button
                          type="button"
                          className="w-full text-left p-3 hover:bg-bg transition-colors"
                          onClick={() => setExpandedVisitor(isExpanded ? null : v.id)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-textMuted flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />}

                            <span className="text-sm font-medium">{source.emoji} {source.label}</span>

                            {isHighIntent && (
                              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">HIGH INTENT</span>
                            )}
                            {(v.metrics?.isReturning || v.historyMetrics?.isReturning) && (
                              <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">RETURNING</span>
                            )}

                            <span className="text-xs text-textMuted ml-auto flex items-center gap-2">
                              {v.device?.isMobile
                                ? <Smartphone className="w-3 h-3" />
                                : <Monitor className="w-3 h-3" />}
                              {locationStr && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {locationStr}</span>}
                              <span>{pageViews.length} {pageViews.length === 1 ? 'page' : 'pages'}</span>
                              <span>{timeAgo}</span>
                            </span>
                          </div>
                          <p className="text-xs text-textMuted mt-1 ml-5 truncate">{v.source?.landingPage || '/'}</p>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border bg-bg p-4 space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="bg-white rounded-card border border-border p-3">
                                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Source</p>
                                <dl className="space-y-1 text-xs">
                                  {[
                                    ['Landing', v.source?.landingPage],
                                    ['Referrer', v.source?.referrer || 'Direct'],
                                    ['UTM source', v.source?.utmSource],
                                    ['UTM campaign', v.source?.utmCampaign],
                                    ['gclid', v.source?.gclid],
                                  ].filter(([, val]) => val).map(([k, val]) => (
                                    <div key={k} className="flex gap-2">
                                      <dt className="text-textMuted w-24 flex-shrink-0">{k}</dt>
                                      <dd className="text-textPrimary font-medium truncate">{val}</dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>

                              <div className="bg-white rounded-card border border-border p-3">
                                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Session</p>
                                <dl className="space-y-1 text-xs">
                                  {[
                                    ['Pages', pageViews.length],
                                    ['Scroll depth', v.currentSession?.maxScrollDepth != null ? `${v.currentSession.maxScrollDepth}%` : null],
                                    ['Time on site', v.currentSession?.timeOnSite ? `${v.currentSession.timeOnSite}s` : null],
                                    ['Plan clicks', v.currentSession?.bookingClicks || null],
                                    ['Phone clicks', v.currentSession?.phoneClicks || null],
                                    ['Location', locationStr],
                                    ['Device', v.device?.isMobile ? 'Mobile' : 'Desktop'],
                                    ['Visitor ID', v.id],
                                  ].filter(([, val]) => val != null && val !== '').map(([k, val]) => (
                                    <div key={k} className="flex gap-2">
                                      <dt className="text-textMuted w-24 flex-shrink-0">{k}</dt>
                                      <dd className="text-textPrimary font-medium truncate">{String(val)}</dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>
                            </div>

                            {intentSignals.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                <span className="text-xs text-textMuted">Intent signals:</span>
                                {intentSignals.map((sig, i) => (
                                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">{sig}</span>
                                ))}
                              </div>
                            )}

                            {pageViews.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">Page journey</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {pageViews.map((pv, i) => (
                                    <span key={i} className="text-xs bg-white border border-border text-textSecondary px-2 py-0.5 rounded font-mono">{pv.path}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}
        </div>

        {/* ── Intake sessions ─────────────────────────────────────────── */}
        <div ref={sessionsRef} className="bg-white rounded-card-lg border border-border p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-textPrimary">Intake sessions</h3>
              <p className="text-xs text-textMuted mt-0.5">Every chat session — structured data, owner details, and full conversation.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void runIntakeBackfill()} loading={intakeBackfillLoading} disabled={intakeBackfillLoading || sessionsLoading} title="Reconstruct historical sessions from the intake_chat_messages log">
                Backfill from logs
              </Button>
              <Button type="button" size="sm" onClick={() => void fetchSessions()} loading={sessionsLoading} disabled={sessionsLoading}>
                Refresh
              </Button>
            </div>
          </div>
          {intakeBackfillResult && (
            <p className="text-sm text-textSecondary">
              Backfill: inserted {intakeBackfillResult.inserted} sessions from {intakeBackfillResult.total_sessions_in_log} in log, {intakeBackfillResult.skipped} already imported.
            </p>
          )}

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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setReplySession(s) }}
                          className="flex items-center gap-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Mail className="w-3 h-3" /> Reply
                        </button>
                        <StatusBadge status={s.status} />
                      </div>
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
                                    const text = m.content
                                      .replace(/INTAKE_COMPLETE:\{[\s\S]*\}/, '')
                                      .replace('[INTAKE_COMPLETE_REDACTED]', '')
                                      .trim()
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

      {replySession && (
        <ReplyModal
          session={replySession}
          msToken={msTokenCache}
          onClose={() => setReplySession(null)}
        />
      )}
    </div>
  )
}
