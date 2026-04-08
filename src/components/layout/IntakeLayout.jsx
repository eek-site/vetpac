import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ProgressBar from '../ui/ProgressBar'
import { INTAKE_STEPS } from '../../lib/constants'

export default function IntakeLayout({ children }) {
  const location = useLocation()
  const currentIndex = INTAKE_STEPS.findIndex((s) => s.path === location.pathname)
  const step = currentIndex + 1
  const total = INTAKE_STEPS.length
  const prevPath = currentIndex > 0 ? INTAKE_STEPS[currentIndex - 1].path : '/'

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link to={prevPath} className="flex items-center gap-1.5 text-sm text-textMuted hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {currentIndex === 0 ? 'Back to home' : 'Back'}
            </Link>
            <Link to="/" className="font-display font-bold text-lg text-primary">VetPac</Link>
            <span className="text-sm text-textMuted font-medium">Step {step} of {total}</span>
          </div>
          <ProgressBar current={step} total={total} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-card-lg shadow-card p-6 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}
