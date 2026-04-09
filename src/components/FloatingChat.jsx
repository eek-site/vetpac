import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { runContactChat, parseContactSubmit } from '../lib/claude'
import { logSiteEvent } from '../lib/logSiteEvent'

const OPENING = {
  role: 'assistant',
  content: "Hi! Any questions about your plan, the vaccines, or how self-administration works? I'm here.",
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([OPENING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open && !loading) inputRef.current?.focus()
  }, [open, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const reply = await runContactChat(updated.map(({ role, content }) => ({ role, content })))
      logSiteEvent('contact_ai_message', { context: 'floating_chat' })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      const contact = parseContactSubmit(reply)
      if (contact && !sent) {
        await fetch('/api/send-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: contact.name || 'Plan page visitor',
            email: contact.email || '',
            phone: contact.phone || '',
            message: contact.message || '',
            conversation: updated.map((m) => `${m.role === 'user' ? 'Customer' : 'VetPac'}: ${m.content}`).join('\n\n'),
          }),
        })
        setSent(true)
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-40 w-[calc(100vw-32px)] sm:w-80 bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden" style={{ maxHeight: '420px' }}>
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white flex-shrink-0">
            <div>
              <p className="font-semibold text-sm">Ask VetPac</p>
              <p className="text-xs text-white/70">Replies instantly</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-bg/40">
            {messages.map((m, i) => {
              const isUser = m.role === 'user'
              const text = m.content.replace(/CONTACT_SUBMIT:\{[\s\S]*?\}/, '').trim()
              if (!text) return null
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                    isUser ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-border text-textPrimary rounded-bl-sm shadow-sm'
                  }`}>
                    {text}
                  </div>
                </div>
              )
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-border rounded-xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border px-3 py-2 flex gap-2 flex-shrink-0 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything…"
              disabled={loading}
              className="flex-1 text-xs px-3 py-2 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-bg disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-4 sm:right-6 z-40 w-13 h-13 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 px-4 py-3"
      >
        {open ? <X className="w-5 h-5" /> : <><MessageCircle className="w-5 h-5" /><span className="text-sm font-semibold">Ask</span></>}
      </button>
    </>
  )
}
