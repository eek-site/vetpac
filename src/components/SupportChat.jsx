import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

/**
 * SupportChat — floating "Contact us" widget.
 * Sends the user's message to woof@vetpac.nz via /api/send-contact.
 * Distinct from FloatingChat (AI assistant).
 */
export default function SupportChat() {
  const [open, setOpen] = useState(false)

  // Allow any component to open the chat via: window.dispatchEvent(new CustomEvent('vetpac:open-chat'))
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('vetpac:open-chat', handler)
    return () => window.removeEventListener('vetpac:open-chat', handler)
  }, [])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const textRef = useRef(null)

  useEffect(() => {
    if (open && !sent) textRef.current?.focus()
  }, [open, sent])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/send-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'VetPac customer',
          email: email.trim() || '(not provided)',
          phone: '',
          message: message.trim(),
        }),
      })
      if (!res.ok) throw new Error('Send failed')
      setSent(true)
    } catch {
      setError('Something went wrong — please try again or email woof@vetpac.nz directly.')
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setSent(false)
    setName('')
    setEmail('')
    setMessage('')
    setError(null)
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-84 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
          style={{ maxWidth: '360px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white flex-shrink-0">
            <div>
              <p className="font-semibold text-sm">Contact VetPac</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>We respond as quickly as possible</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-4 flex-1 overflow-y-auto">
            {sent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-textPrimary text-sm">Message received</p>
                  <p className="text-xs text-textSecondary mt-1">We'll get back to you as quickly as possible. Check your email for our reply.</p>
                </div>
                <button
                  onClick={reset}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Emergency disclaimer */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical emergency?</strong> Call your local vet immediately — don't wait for a reply.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-textSecondary mb-1">Your name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Sam"
                      className="w-full text-xs px-3 py-2 border border-border rounded-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-bg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-textSecondary mb-1">Email (for reply)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full text-xs px-3 py-2 border border-border rounded-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-bg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">Your message <span className="text-accent">*</span></label>
                  <textarea
                    ref={textRef}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="What can we help with?"
                    rows={4}
                    required
                    className="w-full text-xs px-3 py-2 border border-border rounded-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-bg resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-semibold py-2.5 rounded-card hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close support chat' : 'Contact VetPac'}
        className="fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all px-4 py-3"
      >
        {open
          ? <X className="w-5 h-5" />
          : <><MessageCircle className="w-5 h-5" /><span className="text-sm font-semibold">Contact us</span></>
        }
      </button>
    </>
  )
}
