/**
 * /auth/callback — exchanges a Supabase magic-link token hash for a session,
 * then redirects to /dashboard. This bypasses Supabase's "Site URL" setting
 * so the Supabase dashboard doesn't need to be reconfigured.
 *
 * URL params accepted:
 *   ?token_hash=...&type=magiclink   (our custom flow via /api/request-magic-link)
 *   #access_token=...                (legacy Supabase fragment redirect)
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function handle() {
      // 1. Hash-fragment tokens (#access_token=...) — set by Supabase on redirect
      const hash = window.location.hash
      if (hash.includes('access_token=')) {
        // Supabase client picks this up automatically via detectSessionInUrl
        // Wait briefly for supabase.auth to process, then redirect
        await new Promise(r => setTimeout(r, 800))
        const { data: { session } } = await supabase.auth.getSession()
        if (session) { navigate('/dashboard', { replace: true }); return }
      }

      // 2. token_hash query param — our custom flow
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type') || 'magiclink'
      if (tokenHash) {
        const { error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (err) { setError(err.message); return }
        navigate('/dashboard', { replace: true })
        return
      }

      // 3. Nothing to process — go to dashboard (Supabase may have already set session)
      navigate('/dashboard', { replace: true })
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
