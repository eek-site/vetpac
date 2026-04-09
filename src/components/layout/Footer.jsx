import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="18" fill="#52B788" />
                <path d="M11 22c0-4 3.134-7 7-7s7 3 7 7" stroke="#F9F6F1" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <circle cx="13" cy="13" r="2" fill="#D4673A"/>
                <circle cx="23" cy="13" r="2" fill="#D4673A"/>
                <circle cx="10" cy="17" r="1.5" fill="#D4673A"/>
                <circle cx="26" cy="17" r="1.5" fill="#D4673A"/>
                <ellipse cx="18" cy="23" rx="4" ry="3" fill="#D4673A"/>
              </svg>
              <span className="font-display font-bold text-2xl">VetPac</span>
            </div>
            <p className="text-primary-light text-sm mb-4 max-w-xs leading-relaxed">
              Your puppy's health, delivered. NZ's first at-home puppy vaccination platform.
            </p>
            <p className="text-white/50 text-xs leading-relaxed max-w-sm">
              VetPac operates under the ACVM Act 1997 VOI framework. Every vaccination plan is reviewed and authorised by a NZ-registered veterinarian before anything is confirmed. Your puppy's health and safety is our only priority.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/70 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5">
              {['How It Works', 'Pricing', 'FAQ', 'Dashboard'].map((item) => (
                <li key={item}>
                  <a href={item === 'Dashboard' ? '/dashboard' : `/#${item.toLowerCase().replace(/ /g, '-')}`}
                    className="text-sm text-white/70 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/70 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Legal & Compliance', path: '/legal' },
                { label: 'Contact', path: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="text-sm text-white/70 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">© 2025 VetPac. A <a href="https://formanpacific.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors underline underline-offset-2">Forman Pacific LLC</a> company.</p>
          <p className="text-white/50 text-sm flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-accent fill-accent" /> for NZ puppy owners
          </p>
        </div>
      </div>
    </footer>
  )
}
