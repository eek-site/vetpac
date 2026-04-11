import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { getVisitorId } from '../lib/visitorId'

function saveMessage(role, content, email) {
  fetch('/api/chat-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor_id: getVisitorId(), email: email || null, role, content, source: 'support' }),
  }).catch(() => {})
}

const STORAGE_KEY = 'vetpac_chat_v1'
const MAX_STORED = 60 // max messages to keep in storage

const QUICK_REPLIES = [
  'How does self-administration work?',
  'What vaccines does my puppy need?',
  'Tell me about VetPac Assist',
  'How does the warranty work?',
]

const INTENT_OPENERS = {
  'warranty-claim':    "I can help you file a warranty claim. To get started:\n\n1. Your order reference number\n2. Your dog's name\n3. A brief description of what happened\n\nI'll make sure this gets to the right person straight away.",
  'privacy-request':   "I can help with a privacy request under the NZ Privacy Act 2020. What would you like to do?\n\n• Access the personal information we hold\n• Correct inaccurate information\n• Request deletion of your data\n• Something else\n\nJust let me know.",
  'complaint':         "I'm sorry something hasn't gone right. I want to make sure this is resolved properly.\n\nCould you tell me what happened? I'll log this and make sure the right person follows up within 2 business days.",
  'product-concern':   "Please don't use the product until we've confirmed it's safe.\n\nCould you describe the concern? For example — is the temperature strip triggered, is the packaging damaged, or something else wrong?",
  'dispute':           "I'd like to help resolve this. Before any formal steps, let's see if we can sort it out directly.\n\nCan you tell me what the issue is about?",
  'reschedule':        "No problem — rescheduling is free and unlimited. What date and time works best for you, and which dog/order is this for?",
}

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveMessages(msgs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED)))
  } catch {}
}

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  // Restore from localStorage on first render
  const [messages, setMessagesRaw] = useState(() => loadMessages())
  const [unread, setUnread] = useState(0)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Wrapper that always persists to storage
  const setMessages = useCallback((updater) => {
    setMessagesRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveMessages(next)
      return next
    })
  }, [])

  // Track unread count when chat is closed
  const prevLenRef = useRef(messages.length)
  useEffect(() => {
    if (!open && messages.length > prevLenRef.current) {
      setUnread(u => u + (messages.length - prevLenRef.current))
    }
    prevLenRef.current = messages.length
  }, [messages, open])

  // Clear unread when opened
  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Handle open-chat events (with optional intent)
  useEffect(() => {
    const handler = (e) => {
      const intent = e.detail?.intent
      const opener = intent && INTENT_OPENERS[intent]

      setMessagesRaw(prev => {
        let next
        if (!opener) {
          // No intent — just open, seed welcome only if empty
          if (prev.length === 0) {
            next = [{ role: 'assistant', content: "Hi! I'm the VetPac assistant. I can answer questions about puppy vaccination, how the programme works, pricing, or anything else. What can I help you with?" }]
          } else {
            next = prev
          }
        } else if (prev.length === 0) {
          // Empty conversation — use intent as opening message
          next = [{ role: 'assistant', content: opener }]
        } else {
          // Existing conversation — append a context separator then the intent message
          next = [
            ...prev,
            { role: 'system-divider', content: `— New topic: ${intent.replace(/-/g, ' ')} —` },
            { role: 'assistant', content: opener },
          ]
        }
        saveMessages(next)
        return next
      })

      setOpen(true)
    }

    window.addEventListener('vetpac:open-chat', handler)
    return () => window.removeEventListener('vetpac:open-chat', handler)
  }, [])

  // Seed welcome message if opening fresh with no history
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm the VetPac assistant. I can answer questions about puppy vaccination, how the programme works, pricing, or anything else. What can I help you with?",
      }])
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return
    setInput('')

    // Filter out dividers when sending to API
    const apiMessages = [...messages, { role: 'user', content: userText }]
      .filter(m => m.role !== 'system-divider')

    setMessages(prev => [...prev, { role: 'user', content: userText }])
    saveMessage('user', userText)
    setLoading(true)

    try {
      const res = await fetch('/api/ai-contact-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages.map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      const reply = data.text || "I'm sorry, I couldn't get a response right now. Please try again."

      if (reply.includes('CONTACT_SUBMIT:')) {
        const jsonMatch = reply.match(/CONTACT_SUBMIT:(\{.*?\})/)
        let knownEmail = null
        if (jsonMatch) {
          try {
            const contactData = JSON.parse(jsonMatch[1])
            knownEmail = contactData.email || null
            await fetch('/api/send-contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(contactData),
            })
            setEscalated(true)
          } catch {}
        }
        const cleanReply = reply.replace(/CONTACT_SUBMIT:\{.*?\}/, '').trim()
        setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }])
        saveMessage('assistant', cleanReply, knownEmail)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
        saveMessage('assistant', reply)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setEscalated(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // Count visible messages (excludes dividers)
  const visibleMessages = messages.filter(m => m.role !== 'system-divider')
  const hasHistory = messages.length > 0

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{ width: 'min(360px, calc(100vw - 32px))', height: 'min(540px, calc(100vh - 120px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a3c2e] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle size={15} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white leading-tight">VetPac</p>
                <p className="text-xs text-white/60 leading-tight">AI assistant · team notified of every chat</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasHistory && (
                <button
                  onClick={clearChat}
                  title="Clear chat history"
                  className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/60 hover:text-white"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Emergency banner */}
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
            <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-snug"><strong>Veterinary emergency?</strong> Contact your local vet immediately.</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => {
              if (m.role === 'system-divider') {
                return (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{m.content}</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                )
              }
              return (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#1a3c2e] text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {escalated && (
              <div className="text-center py-2">
                <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                  ✓ Your message has been passed to the VetPac team. We'll follow up with you directly.
                </p>
              </div>
            )}

            {/* Quick replies — only show after first AI message and before user has replied */}
            {visibleMessages.length === 1 && visibleMessages[0].role === 'assistant' && !loading && (
              <div className="space-y-1.5 pt-1">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="w-full text-left text-xs border border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl px-3 py-2 text-slate-600 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-slate-100 px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything…"
                rows={1}
                className="flex-1 text-sm resize-none border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 max-h-24"
                style={{ lineHeight: '1.4' }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 flex items-center justify-center bg-[#1a3c2e] text-white rounded-xl hover:bg-[#2d5a42] disabled:opacity-40 transition-colors shrink-0"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">Every conversation is reviewed by the VetPac team</p>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Chat with VetPac'}
        className="fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-2 bg-[#1a3c2e] text-white rounded-full shadow-lg hover:bg-[#2d5a42] transition-all px-4 py-3"
      >
        {open
          ? <X size={18} />
          : <>
              <MessageCircle size={18} />
              <span className="text-sm font-semibold">Chat with us</span>
              {unread > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center -mr-1">
                  {unread}
                </span>
              )}
            </>
        }
      </button>
    </>
  )
}
