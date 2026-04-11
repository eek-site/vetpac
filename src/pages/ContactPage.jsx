import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Send, Loader2, CheckCircle, MessageCircle, AlertTriangle,
  Shield, ClipboardList, HelpCircle, Phone, ChevronRight,
} from 'lucide-react'
import { runContactChat, parseContactSubmit } from '../lib/claude'
import { logSiteEvent } from '../lib/logSiteEvent'
import SEO from '../components/SEO'

const OPENING_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm the VetPac concierge. I can answer questions about how the service works, pricing, what to expect, or anything else on your mind.\n\nWhat can I help you with?",
}

const QUICK_SUGGESTIONS = [
  { label: 'How does it work?', icon: HelpCircle },
  { label: 'What does it cost?', icon: ClipboardList },
  { label: 'Is it safe for my puppy?', icon: Shield },
  { label: 'Do you cover my area?', icon: Phone },
]

const HELP_LINKS = [
  { label: 'Puppy vaccination guide', to: '/guide', sub: 'C3, C5, schedules & more' },
  { label: 'Warranty terms', to: '/warranty-terms', sub: 'What's covered & how to claim' },
  { label: 'Privacy policy', to: '/privacy', sub: 'Your data & your rights' },
  { label: 'Terms of service', to: '/terms', sub: 'Our service agreement' },
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-[#1a3c2e] flex items-center justify-center flex-shrink-0 shadow-sm">
        <MessageCircle size={14} className="text-white" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5 h-4">
          <span className="w-2 h-2 rounded-full bg-[#1a3c2e]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#1a3c2e]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#1a3c2e]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  const displayText = message.content.replace(/CONTACT_SUBMIT:\{[\s\S]*?\}/, '').trim()
  if (!displayText) return null
  return (
    <div className={`flex items-end gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#1a3c2e] flex items-center justify-center flex-shrink-0 shadow-sm">
          <MessageCircle size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-[#1a3c2e] text-white rounded-2xl rounded-br-sm'
          : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm'
      }`}>
        {displayText}
      </div>
    </div>
  )
}

function SentState() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-[#1a3c2e] flex items-center justify-center flex-shrink-0 shadow-sm">
        <MessageCircle size={14} className="text-white" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-slate-800 text-sm">Message sent to the team.</span>
        </div>
        <p className="text-sm text-slate-500">
          Someone will be in touch shortly. In the meantime, feel free to keep asking me anything.
        </p>
      </div>
    </div>
  )
}

export default function ContactPage() {
  const [messages, setMessages] = useState([OPENING_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [started, setStarted] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, sent])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  const send = async (text) => {
    const msgText = (text || input).trim()
    if (!msgText || loading) return
    setStarted(true)

    const userMsg = { role: 'user', content: msgText }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }))
      const reply = await runContactChat(apiMessages)
      logSiteEvent('contact_ai_message', { context: 'contact_page' })
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])

      const contactData = parseContactSubmit(reply)
      if (contactData && !sent) {
        const transcript = updatedMessages
          .filter(m => m.role !== 'system')
          .map(m => `${m.role === 'user' ? 'Customer' : 'VetPac'}: ${m.content}`)
          .join('\n\n')
        const res = await fetch('/api/send-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: contactData.name || 'Website visitor',
            email: contactData.email || '',
            phone: contactData.phone || '',
            message: contactData.message || '',
            conversation: transcript,
          }),
        })
        if (res.ok) setSent(true)
      }
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      <SEO
        title="Contact & Concierge"
        description="Chat with the VetPac concierge — get instant answers about at-home puppy vaccination, pricing, schedules, and more. Escalates to a real person when needed."
        path="/contact"
      />

      <div className="min-h-screen bg-slate-50 flex flex-col">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="bg-[#1a3c2e] text-white px-4 py-8 pt-24">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={22} className="text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl sm:text-3xl leading-tight mb-1">
                  VetPac Concierge
                </h1>
                <p className="text-white/70 text-sm max-w-lg">
                  AI-powered, with every conversation reviewed by the team. Ask anything — we'll escalate to a real person when it matters.
                </p>
              </div>
              <div className="ml-auto hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/80 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body: sidebar + chat ─────────────────────────────── */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex gap-6 items-start">

          {/* Sidebar — desktop only */}
          <aside className="hidden lg:flex flex-col gap-4 w-64 flex-shrink-0 sticky top-6">

            {/* Emergency */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm mb-0.5">Veterinary emergency?</p>
                  <p className="text-amber-800 text-xs leading-relaxed">Contact your local vet immediately. Do not wait for a chat response.</p>
                </div>
              </div>
            </div>

            {/* Helpful links */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Helpful links</p>
              <div className="space-y-1">
                {HELP_LINKS.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-start justify-between gap-2 rounded-xl p-2.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700 group-hover:text-[#1a3c2e] transition-colors leading-tight">{link.label}</p>
                      <p className="text-xs text-slate-400 leading-tight mt-0.5">{link.sub}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-[#1a3c2e] mt-1 flex-shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Response time */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5">
              <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" /> AI replies instantly</p>
              <p className="flex items-center gap-2"><span className="w-2 h-2 bg-teal-400 rounded-full flex-shrink-0" /> Team escalations: same day</p>
              <p className="flex items-center gap-2"><span className="w-2 h-2 bg-slate-300 rounded-full flex-shrink-0" /> Every chat is reviewed</p>
            </div>
          </aside>

          {/* Chat panel */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ minHeight: 'calc(100vh - 260px)' }}>

            {/* Mobile emergency strip */}
            <div className="lg:hidden flex items-start gap-2 px-4 py-3 bg-amber-50 border-b border-amber-200">
              <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800"><strong>Emergency?</strong> Contact your local vet immediately.</p>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-5">
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg} />
              ))}
              {loading && <TypingIndicator />}
              {sent && !loading && <SentState />}
              {error && (
                <div className="text-center mb-4">
                  <span className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">{error}</span>
                </div>
              )}

              {/* Quick suggestion chips — show before user sends first message */}
              {!started && (
                <div className="mt-2 mb-4">
                  <p className="text-xs text-slate-400 mb-2.5 font-medium">Common questions</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SUGGESTIONS.map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        onClick={() => send(label)}
                        className="flex items-center gap-1.5 text-xs border border-slate-200 hover:border-[#1a3c2e] hover:bg-[#1a3c2e]/5 text-slate-600 hover:text-[#1a3c2e] rounded-xl px-3 py-2 transition-colors"
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 bg-white px-4 py-3">
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything…"
                  disabled={loading}
                  rows={1}
                  className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]/20 focus:border-[#1a3c2e] bg-slate-50 disabled:opacity-50 leading-relaxed"
                  style={{ maxHeight: '120px', overflowY: 'auto' }}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-[#1a3c2e] flex items-center justify-center flex-shrink-0 hover:bg-[#2d5a42] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-4 h-4 text-white" />
                  }
                </button>
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Press Enter to send · every conversation is reviewed by the VetPac team
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
