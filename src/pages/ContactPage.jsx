import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { runContactChat, parseContactSubmit } from '../lib/claude'
import { logSiteEvent } from '../lib/logSiteEvent'

const OPENING_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm the VetPac concierge. I can answer questions about how the service works, pricing, what to expect, or anything else on your mind.\n\nWhat can I help you with?",
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
        V
      </div>
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
  const displayText = message.content.replace(/CONTACT_SUBMIT:\{[\s\S]*?\}/, '').trim()
  if (!displayText) return null
  return (
    <div className={`flex items-end gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
          V
        </div>
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

function SentState() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
        V
      </div>
      <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm max-w-[78%]">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-textPrimary text-sm">Message sent to the team.</span>
        </div>
        <p className="text-sm text-textSecondary">
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

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, sent])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }))
      const reply = await runContactChat(apiMessages)
      logSiteEvent('contact_ai_message', { context: 'contact_page' })
      const assistantMsg = { role: 'assistant', content: reply }
      setMessages((prev) => [...prev, assistantMsg])

      // Check if we need to submit a contact email
      const contactData = parseContactSubmit(reply)
      if (contactData && !sent) {
        // Build conversation transcript
        const transcript = updatedMessages
          .filter((m) => m.role !== 'system')
          .map((m) => `${m.role === 'user' ? 'Customer' : 'VetPac'}: ${m.content}`)
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Subheader */}
      <div className="border-b border-border bg-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="font-semibold text-textPrimary text-sm">VetPac Concierge</p>
          <p className="text-xs text-textMuted">Powered by AI · escalates to the team when needed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-textMuted font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything…"
            disabled={loading}
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
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </button>
        </div>
        <p className="text-center text-xs text-textMuted mt-2 max-w-2xl mx-auto">
          Enter to send · for urgent help, use the chat button
        </p>
      </div>
    </div>
  )
}
