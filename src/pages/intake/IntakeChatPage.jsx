import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Send, Loader2, CheckCircle, ArrowRight } from 'lucide-react'
import { useIntakeStore } from '../../store/intakeStore'
import { runIntakeChat, parseIntakeComplete } from '../../lib/claude'
import { logSiteEvent } from '../../lib/logSiteEvent'

const OPENING_MESSAGE = {
  role: 'assistant',
  content: "Hi there! I'm here to get your puppy's vaccination programme sorted.\n\nTo start — what's your puppy's name, and what breed are they?",
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
  // Strip the INTAKE_COMPLETE marker from displayed text
  const displayText = message.content.replace(/INTAKE_COMPLETE:\{[\s\S]*\}/, '').trim()

  return (
    <div className={`flex items-end gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
          V
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-white rounded-2xl rounded-br-sm'
            : 'bg-white border border-border text-textPrimary rounded-2xl rounded-bl-sm'
        }`}
      >
        {displayText}
      </div>
    </div>
  )
}

function CompleteState({ puppyName, onContinue }) {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
        V
      </div>
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

export default function IntakeChatPage() {
  const navigate = useNavigate()
  const {
    updateDogProfile, updateHealthHistory, updateLifestyle, updateOwnerDetails,
  } = useIntakeStore()

  const [messages, setMessages] = useState([OPENING_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [complete, setComplete] = useState(false)
  const [puppyName, setPuppyName] = useState('your puppy')

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const loggedPageView = useRef(false)
  const loggedFirstMessage = useRef(false)

  useEffect(() => {
    if (!loggedPageView.current) {
      loggedPageView.current = true
      logSiteEvent('intake_page_view', { path: '/intake' })
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, complete])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    if (!loggedFirstMessage.current) {
      loggedFirstMessage.current = true
      logSiteEvent('intake_user_message', { path: '/intake' })
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Only pass role+content to the API (strip display-only fields)
      const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }))
      const reply = await runIntakeChat(apiMessages)

      const assistantMsg = { role: 'assistant', content: reply }
      setMessages((prev) => [...prev, assistantMsg])

      // Check if intake is complete
      const intakeData = parseIntakeComplete(reply)
      if (intakeData) {
        logSiteEvent('intake_completed', { path: '/intake' })
        if (intakeData.dogProfile) updateDogProfile(intakeData.dogProfile)
        if (intakeData.healthHistory) updateHealthHistory(intakeData.healthHistory)
        if (intakeData.lifestyle) updateLifestyle(intakeData.lifestyle)
        if (intakeData.ownerDetails) updateOwnerDetails(intakeData.ownerDetails)
        setPuppyName(intakeData.dogProfile?.name || 'your puppy')
        setComplete(true)
      }
    } catch (err) {
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
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white flex-shrink-0">
        <Link to="/" className="font-display font-bold text-lg text-primary">VetPac</Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-textMuted font-medium">AI intake · online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}

        {loading && <TypingIndicator />}

        {complete && !loading && (
          <CompleteState puppyName={puppyName} onContinue={() => navigate('/intake/review')} />
        )}

        {error && (
          <div className="text-center mb-4">
            <span className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
              {error}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!complete && (
        <div className="border-t border-border bg-white px-4 py-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your reply…"
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
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  )
}
