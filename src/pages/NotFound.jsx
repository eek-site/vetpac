import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🐕</div>
        <h1 className="font-display font-bold text-4xl text-textPrimary mb-3">Page not found</h1>
        <p className="text-textSecondary mb-8 max-w-sm mx-auto">
          This page has wandered off. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/"><Button>Back to home</Button></Link>
          <Link to="/intake"><Button variant="secondary">Start health intake</Button></Link>
        </div>
      </div>
    </div>
  )
}
