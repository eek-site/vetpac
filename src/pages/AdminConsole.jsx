import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Shield, LogOut, ExternalLink, LayoutDashboard } from 'lucide-react'
import Button from '../components/ui/Button'

/** Same tenant / client as EEK Graph app — override with VITE_MSAL_* in env. */
const MSAL_CDN = 'https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js'

function getMsalConfig() {
  return {
    auth: {
      clientId: import.meta.env.VITE_MSAL_CLIENT_ID || 'd67be044-6aaa-4d01-ada2-da0cc50d2034',
      authority:
        import.meta.env.VITE_MSAL_AUTHORITY ||
        'https://login.microsoftonline.com/61ffc6bc-d9ce-458b-8120-d32187c3770d',
      redirectUri: `${window.location.origin}/admin`,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: true,
    },
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load MSAL'))
    document.head.appendChild(s)
  })
}

export default function AdminConsole() {
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [account, setAccount] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Admin — VetPac'
    let meta = document.querySelector('meta[name="robots"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    meta.content = 'noindex, nofollow'
    return () => {
      document.title = "VetPac — Your puppy's health, at home."
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await loadScript(MSAL_CDN)
        if (cancelled || !window.msal?.PublicClientApplication) throw new Error('MSAL not available')

        const pca = new window.msal.PublicClientApplication(getMsalConfig())
        if (typeof pca.initialize === 'function') await pca.initialize()
        window.__vetpacMsal = pca

        const redirect = await pca.handleRedirectPromise()
        if (cancelled) return

        if (redirect?.account) {
          pca.setActiveAccount(redirect.account)
          setAccount(redirect.account)
          setPhase('authed')
          return
        }

        const existing = pca.getActiveAccount() || pca.getAllAccounts()?.[0]
        if (existing) {
          pca.setActiveAccount(existing)
          setAccount(existing)
          setPhase('authed')
          return
        }

        setPhase('ready')
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setError(e.message || 'Authentication error')
          setPhase('error')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = async () => {
    const pca = window.__vetpacMsal
    if (!pca) {
      setError('Auth not ready — refresh the page.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await pca.loginRedirect({
        scopes: ['openid', 'profile', 'User.Read'],
        prompt: 'select_account',
      })
    } catch (e) {
      console.error(e)
      setError(e.message || 'Sign-in failed')
      setBusy(false)
    }
  }

  const signOut = async () => {
    const pca = window.__vetpacMsal
    setAccount(null)
    setPhase('ready')
    if (pca) {
      try {
        await pca.logoutRedirect({
          postLogoutRedirectUri: `${window.location.origin}/admin`,
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-textMuted">Loading admin…</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 text-center">
        <p className="text-textPrimary font-semibold mb-2">Could not load sign-in</p>
        <p className="text-sm text-textMuted mb-6">{error}</p>
        <Link to="/" className="text-primary font-semibold hover:underline">
          Back to site
        </Link>
      </div>
    )
  }

  if (phase === 'ready' || !account) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <header className="border-b border-border bg-white px-4 py-4">
          <Link to="/" className="font-display font-bold text-xl text-primary">
            VetPac
          </Link>
          <span className="ml-3 text-xs font-semibold text-textMuted uppercase tracking-wide">Admin</span>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md bg-white rounded-card-lg shadow-card border border-border p-8 text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="font-display font-bold text-2xl text-textPrimary mb-2">VetPac admin</h1>
            <p className="text-sm text-textSecondary mb-8">
              Sign in with your Microsoft work account (same tenant as Forman Pacific).
            </p>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <Button fullWidth size="lg" onClick={signIn} loading={busy} disabled={busy}>
              Sign in with Microsoft
            </Button>
            <Link to="/" className="inline-block mt-6 text-sm text-primary font-medium hover:underline">
              ← Back to vetpac.nz
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const displayName = account.name || account.username || 'Admin'
  const email = account.username || ''

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border bg-white px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display font-bold text-xl text-primary">
            VetPac
          </Link>
          <span className="text-xs font-semibold text-textMuted uppercase tracking-wide px-2 py-1 bg-bg rounded-full">
            Admin console
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-textSecondary hidden sm:inline font-mono truncate max-w-[200px]">{email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-textPrimary mb-1">
            Welcome, {displayName.split(' ')[0]}
          </h2>
          <p className="text-sm text-textMuted">Signed in as {email}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="https://vetpac.nz/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-5 bg-white rounded-card-lg border border-border shadow-sm hover:border-primary/40 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-textPrimary group-hover:text-primary flex items-center gap-1">
                Customer dashboard <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </p>
              <p className="text-sm text-textMuted mt-1">Public customer dashboard (opens in a new tab).</p>
            </div>
          </a>

          <Link
            to="/"
            className="flex items-start gap-4 p-5 bg-white rounded-card-lg border border-border shadow-sm hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg" aria-hidden>
                🏠
              </span>
            </div>
            <div>
              <p className="font-semibold text-textPrimary">Marketing site</p>
              <p className="text-sm text-textMuted mt-1">Homepage, intake, and public pages.</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-card-lg border border-border p-6">
          <h3 className="font-semibold text-textPrimary mb-2">Operations</h3>
          <p className="text-sm text-textSecondary leading-relaxed">
            Add order tools, WhatsApp template checks, or Stripe dashboards here. Authentication uses the same MSAL SPA redirect as your other sites — redirect URI must be{' '}
            <code className="text-xs bg-bg px-1.5 py-0.5 rounded font-mono">https://vetpac.nz/admin</code> (and localhost for dev).
          </p>
        </div>
      </main>
    </div>
  )
}
