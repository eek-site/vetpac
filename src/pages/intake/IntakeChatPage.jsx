import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Send, Loader2, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react'
import { useIntakeStore } from '../../store/intakeStore'
import { runIntakeChat, parseIntakeComplete } from '../../lib/claude'
import { logSiteEvent } from '../../lib/logSiteEvent'
import { logIntakeTurn } from '../../lib/logIntakeMessage'

const SESSION_KEY = 'vetpac-intake-token'

const OPENING_MESSAGE = {
  role: 'assistant',
  content: "Hi there! I'm here to get your puppy's vaccination programme sorted.\n\nTo start — what's your puppy's name, and what breed are they?",
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">V</div>
      <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5 h-4">
          <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  const displayText = message.content.replace(/INTAKE_COMPLETE:\{[\s\S]*\}/, '').trim()
  return (
    <div className={`flex items-end gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">V</div>
      )}
      <div className={`max-w-[78%] px-4 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-primary text-white rounded-2xl rounded-br-sm'
          : 'bg-white border border-border text-textPrimary rounded-2xl rounded-bl-sm'
      }`}>
        {displayText}
      </div>
    </div>
  )
}

function CompleteState({ puppyName, onContinue }) {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">V</div>
      <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm max-w-[78%]">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-textPrimary text-sm">All done — {puppyName}'s details are ready.</span>
        </div>
        <p className="text-sm text-textSecondary mb-3">
          I have everything needed to build {puppyName}'s vaccination programme. The next step is your consultation fee — after that, I'll generate the personalised plan.
        </p>
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-card hover:bg-primary/90 transition-colors"
        >
          See your plan <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function ResumeBanner({ dogName, onResume, onStartFresh }) {
  return (
    <div className="mx-4 mt-4 mb-2 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="font-semibold text-textPrimary text-sm">
          Welcome back{dogName ? ` — ${dogName}'s intake is in progress` : ''}
        </p>
        <p className="text-xs text-textMuted mt-0.5">Continue where you left off, or start a new intake.</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onResume}
          className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-card hover:bg-primary/90 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" /> Continue
        </button>
        <button
          onClick={onStartFresh}
          className="inline-flex items-center gap-1.5 text-textMuted text-xs font-semibold px-3 py-2 rounded-card border border-border hover:border-primary/40 hover:text-textSecondary transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Start fresh
        </button>
      </div>
    </div>
  )
}

// ── Session helpers ─────────────────────────────────────────────────────────

async function createSession(messages) {
  try {
    const r = await fetch('/api/intake-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
    const d = await r.json()
    return d.token || null
  } catch {
    return null
  }
}

async function saveSession(token, payload) {
  if (!token) return
  fetch('/api/intake-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...payload }),
  }).catch(() => {})
}

async function fetchSession(token) {
  try {
    const r = await fetch(`/api/get-intake-session?token=${encodeURIComponent(token)}`)
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

// ── Main component ──────────────────────────────────────────────────────────

export default function IntakeChatPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    updateDogProfile, updateHealthHistory, updateLifestyle, updateOwnerDetails,
  } = useIntakeStore()

  const [messages, setMessages] = useState([OPENING_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [complete, setComplete] = useState(false)
  const [puppyName, setPuppyName] = useState('your puppy')
  const [resumeData, setResumeData] = useState(null)   // pending resume session
  const [checkingResume, setCheckingResume] = useState(true)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const loggedPageView = useRef(false)
  const loggedFirstMessage = useRef(false)
  const turnRef = useRef(0)
  const sessionTokenRef = useRef(null)

  // ── On mount: check for existing session ──────────────────────────────────
  useEffect(() => {
    if (!loggedPageView.current) {
      loggedPageView.current = true
      logSiteEvent('intake_page_view', { path: '/intake' })
    }

    const urlToken = searchParams.get('token')
    const storedToken = localStorage.getItem(SESSION_KEY)
    const token = urlToken || storedToken

    if (!token) {
      setCheckingResume(false)
      return
    }

    fetchSession(token).then((session) => {
      if (!session) {
        // Stale token — clear it
        localStorage.removeItem(SESSION_KEY)
        setCheckingResume(false)
        return
      }

      sessionTokenRef.current = session.token
      localStorage.setItem(SESSION_KEY, session.token)

      if (session.status === 'complete' || session.status === 'paid') {
        // Restore full state silently
        restoreSession(session)
        setCheckingResume(false)
      } else if (session.messages?.length > 1) {
        // In-progress with content — offer resume
        setResumeData(session)
        setCheckingResume(false)
      } else {
        // Barely started — just restore the token, let them see a fresh chat
        setCheckingResume(false)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const restoreSession = (session) => {
    if (session.messages?.length > 0) setMessages(session.messages)
    if (session.dogProfile?.name) setPuppyName(session.dogProfile.name)
    if (session.dogProfile && Object.keys(session.dogProfile).length > 0)
      updateDogProfile(session.dogProfile)
    if (session.healthHistory && Object.keys(session.healthHistory).length > 0)
      updateHealthHistory(session.healthHistory)
    if (session.lifestyle && Object.keys(session.lifestyle).length > 0)
      updateLifestyle(session.lifestyle)
    if (session.ownerDetails && Object.keys(session.ownerDetails).length > 0)
      updateOwnerDetails(session.ownerDetails)
    if (session.status === 'complete' || session.status === 'paid') setComplete(true)
  }

  const handleResume = () => {
    restoreSession(resumeData)
    setResumeData(null)
  }

  const handleStartFresh = () => {
    localStorage.removeItem(SESSION_KEY)
    sessionTokenRef.current = null
    setResumeData(null)
    setMessages([OPENING_MESSAGE])
    setComplete(false)
    setPuppyName('your puppy')
  }

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, complete])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  // ── Send a message ─────────────────────────────────────────────────────────
  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    if (!loggedFirstMessage.current) {
      loggedFirstMessage.current = true
      logSiteEvent('intake_user_message', { path: '/intake' })
    }
    turnRef.current += 1
    logIntakeTurn({ role: 'user', content: text, turnIndex: turnRef.current })

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setError(null)

    // Create session on first real user message
    if (!sessionTokenRef.current) {
      const token = await createSession(updatedMessages)
      if (token) {
        sessionTokenRef.current = token
        localStorage.setItem(SESSION_KEY, token)
      }
    }

    try {
      const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }))
      const reply = await runIntakeChat(apiMessages)

      turnRef.current += 1
      logIntakeTurn({ role: 'assistant', content: reply, turnIndex: turnRef.current })

      const assistantMsg = { role: 'assistant', content: reply }
      const finalMessages = [...updatedMessages, assistantMsg]
      setMessages(finalMessages)

      const intakeData = parseIntakeComplete(reply)
      if (intakeData) {
        logSiteEvent('intake_completed', { path: '/intake' })
        if (intakeData.dogProfile) updateDogProfile(intakeData.dogProfile)
        if (intakeData.healthHistory) updateHealthHistory(intakeData.healthHistory)
        if (intakeData.lifestyle) updateLifestyle(intakeData.lifestyle)
        if (intakeData.ownerDetails) updateOwnerDetails(intakeData.ownerDetails)
        const name = intakeData.dogProfile?.name || 'your puppy'
        setPuppyName(name)
        setComplete(true)

        // Save structured data to DB
        saveSession(sessionTokenRef.current, {
          messages: finalMessages,
          dogProfile: intakeData.dogProfile || {},
          healthHistory: intakeData.healthHistory || {},
          lifestyle: intakeData.lifestyle || {},
          ownerDetails: intakeData.ownerDetails || {},
          aiAssessment: intakeData,
          status: 'complete',
        })
      } else {
        // Save messages only
        saveSession(sessionTokenRef.current, { messages: finalMessages })
      }
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleContinue = () => {
    // Clear token — this intake is done; next visit starts fresh
    localStorage.removeItem(SESSION_KEY)
    navigate('/intake/review')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white flex-shrink-0">
        <Link to="/" className="font-display font-bold text-lg text-primary">VetPac</Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-textMuted font-medium">AI intake · online</span>
        </div>
      </div>

      {/* Resume banner */}
      {!checkingResume && resumeData && (
        <ResumeBanner
          dogName={resumeData.dogProfile?.name || resumeData.dog_name || ''}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {checkingResume ? (
          <div className="flex items-center justify-center h-32 gap-2 text-textMuted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}

            {loading && <TypingIndicator />}

            {complete && !loading && (
              <CompleteState puppyName={puppyName} onContinue={handleContinue} />
            )}

            {error && (
              <div className="text-center mb-4">
                <span className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                  {error}
                </span>
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!complete && !resumeData && (
        <div className="border-t border-border bg-white px-4 py-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your reply…"
              disabled={loading || checkingResume}
              rows={1}
              className="flex-1 resize-none border border-border rounded-2xl px-4 py-3 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-bg disabled:opacity-50 leading-relaxed"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading || checkingResume}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Send className="w-4 h-4 text-white" />
              }
            </button>
          </div>
          <p className="text-center text-xs text-textMuted mt-2 max-w-2xl mx-auto">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  )
}
