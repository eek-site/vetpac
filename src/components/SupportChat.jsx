import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, AlertTriangle, ChevronDown } from 'lucide-react'

const QUICK_REPLIES = [
  'How does self-administration work?',
  'What vaccines does my puppy need?',
  'Tell me about VetPac Assist',
  'How does the warranty work?',
]

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Allow any component to open via: window.dispatchEvent(new CustomEvent('vetpac:open-chat'))
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('vetpac:open-chat', handler)
    return () => window.removeEventListener('vetpac:open-chat', handler)
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm the VetPac assistant. I can answer questions about puppy vaccination, how the programme works, pricing, or anything else you'd like to know. What can I help you with?",
      }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return
    setInput('')

    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai-contact-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      const reply = data.text || "I'm sorry, I couldn't get a response right now. Please try again."

      // Check if escalation was triggered
      if (reply.includes('CONTACT_SUBMIT:')) {
        const jsonMatch = reply.match(/CONTACT_SUBMIT:(\{.*?\})/)
        if (jsonMatch) {
          try {
            const contactData = JSON.parse(jsonMatch[1])
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
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{ width: 'min(360px, calc(100vw - 32px))', height: 'min(520px, calc(100vh - 120px))' }}
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
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white">
              <X size={15} />
            </button>
          </div>

          {/* Emergency banner */}
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
            <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-snug"><strong>Veterinary emergency?</strong> Contact your local vet immediately.</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#1a3c2e] text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

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

            {/* Quick replies — only show after first AI message and before user has sent anything */}
            {messages.length === 1 && !loading && (
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
          : <><MessageCircle size={18} /><span className="text-sm font-semibold">Chat with us</span></>
        }
      </button>
    </>
  )
}
