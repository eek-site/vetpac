/**
 * /auth/callback — exchanges the one-time OTP token in the URL for a JWT session.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { setSession } from '../lib/auth'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function handle() {
      const otp = searchParams.get('token')
      if (!otp) { navigate('/dashboard', { replace: true }); return }

      try {
        const res = await fetch(`/api/auth-callback?token=${encodeURIComponent(otp)}`)
        const data = await res.json()
        if (!res.ok || !data.ok) {
          setError(data.error || 'Link expired or already used.')
          return
        }
        setSession(data.token, data.email)
        navigate('/dashboard', { replace: true })
      } catch {
        setError('Something went wrong. Please try again.')
      }
    }
    handle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-card-lg border border-border p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-textPrimary">Sign-in link expired</p>
            <p className="text-sm text-textSecondary mt-1">This link has expired or already been used. Please request a new one.</p>
          </div>
          <a href="/dashboard" className="inline-block text-sm font-semibold text-primary hover:underline">
            Back to dashboard →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-sm text-textSecondary">Signing you in…</p>
      </div>
    </div>
  )
}
