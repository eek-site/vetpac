import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Button from '../ui/Button'

function PawLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="18" fill="#2A5C45" />
        <path d="M11 22c0-4 3.134-7 7-7s7 3 7 7" stroke="#F9F6F1" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="13" cy="13" r="2" fill="#D4673A"/>
        <circle cx="23" cy="13" r="2" fill="#D4673A"/>
        <circle cx="10" cy="17" r="1.5" fill="#D4673A"/>
        <circle cx="26" cy="17" r="1.5" fill="#D4673A"/>
        <ellipse cx="18" cy="23" rx="4" ry="3" fill="#D4673A"/>
      </svg>
      <span className="font-display font-bold text-xl text-primary group-hover:text-primary-light transition-colors">VetPac</span>
    </Link>
  )
}

const navLinks = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => setMobileOpen(false), [location])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-card' : 'bg-transparent'}`}>
        <div className="max-w-content mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <PawLogo />

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-textSecondary hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">My Account</Button>
            </Link>
            <Link to="/intake">
              <Button size="sm">Start Health Plan →</Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-bg transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-white pt-16 flex flex-col">
          <nav className="flex flex-col p-6 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-lg font-semibold text-textPrimary hover:text-primary py-3 border-b border-border transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-6 space-y-3">
              <Link to="/intake" onClick={() => setMobileOpen(false)}>
                <Button fullWidth size="lg">Start Your puppy's Health Plan →</Button>
              </Link>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" fullWidth size="lg">My Account</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
