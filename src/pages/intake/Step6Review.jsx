import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Lock, CheckCircle, ChevronDown, ChevronUp, Shield, Stethoscope, FileText, Clock,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import IntakeLayout from '../../components/layout/IntakeLayout'
import { useIntakeStore } from '../../store/intakeStore'
import { CONSULTATION_FEE, REGIONAL_CONSULTATION_FEES, calculateConsultFee } from '../../lib/constants'

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeading({ label, sublabel }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-textPrimary">{label}</h3>
      {sublabel && <p className="text-textMuted text-sm mt-0.5">{sublabel}</p>}
    </div>
  )
}

function AdditionalPuppyCard({ index, profile, onChange }) {
  return (
    <div className="bg-bg border border-border rounded-card p-4 space-y-3">
      <p className="text-sm font-semibold text-textPrimary">Puppy {index + 2}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-textSecondary mb-1">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Bella"
            className="w-full border border-border rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-textSecondary mb-1">Breed</label>
          <input
            type="text"
            value={profile.breed}
            onChange={(e) => onChange({ breed: e.target.value })}
            placeholder="e.g. Golden Retriever"
            className="w-full border border-border rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-textSecondary mb-1">Date of birth</label>
          <input
            type="date"
            value={profile.dob}
            onChange={(e) => onChange({ dob: e.target.value })}
            className="w-full border border-border rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-textSecondary mb-1">Sex</label>
          <select
            value={profile.sex}
            onChange={(e) => onChange({ sex: e.target.value })}
            className="w-full border border-border rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function ConsultFeeBlock() {
  const { ownerDetails, lifestyle, numberOfPuppies, setNumberOfPuppies, additionalPuppies, updateAdditionalPuppy } = useIntakeStore()
  const [expanded, setExpanded] = useState(false)
  const region = ownerDetails.region || lifestyle.region || ''
  const basePrice = REGIONAL_CONSULTATION_FEES[region] ?? 289
  const totalFee = calculateConsultFee(region, numberOfPuppies)
  const isAuckland = region === 'Auckland'

  const puppyBreakdown = []
  let price = basePrice
  for (let i = 0; i < numberOfPuppies; i++) {
    puppyBreakdown.push({ n: i + 1, fee: Math.max(Math.round(price), 48) })
    price = price * 0.82
  }

  return (
    <div className="border-2 border-primary/20 bg-primary/5 rounded-card-lg p-5 space-y-4">
      {/* How many puppies */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-textPrimary">How many puppies?</p>
          {region && (
            <p className="text-xs text-textMuted mt-0.5">
              {isAuckland ? 'Auckland rate — matched to local market' : `${region} rate · income-adjusted pricing`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={() => setNumberOfPuppies(numberOfPuppies - 1)}
            disabled={numberOfPuppies <= 1}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg font-bold text-textSecondary hover:bg-primary/10 hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >−</button>
          <span className="w-6 text-center font-bold text-textPrimary">{numberOfPuppies}</span>
          <button
            onClick={() => setNumberOfPuppies(numberOfPuppies + 1)}
            disabled={numberOfPuppies >= 10}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg font-bold text-textSecondary hover:bg-primary/10 hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >+</button>
        </div>
      </div>

      {/* Per-puppy breakdown */}
      {numberOfPuppies > 1 && (
        <div className="bg-white/70 rounded-card border border-border p-3 space-y-1.5">
          {puppyBreakdown.map(({ n, fee }) => (
            <div key={n} className="flex justify-between text-sm">
              <span className="text-textSecondary">
                {n === 1 ? 'First puppy' : `Puppy ${n} · ${Math.round((1 - fee / basePrice) * 100)}% discount`}
              </span>
              <span className="font-mono font-semibold">${fee}</span>
            </div>
          ))}
          <div className="border-t border-border pt-1.5 flex justify-between text-sm font-semibold">
            <span>Total consultation</span>
            <span className="font-mono text-primary">${totalFee}</span>
          </div>
        </div>
      )}

      {/* Additional puppy profiles */}
      {numberOfPuppies > 1 && (
        <div className="space-y-3">
          <p className="text-sm text-textSecondary font-medium">Tell us about your other puppies</p>
          {additionalPuppies.map((profile, i) => (
            <AdditionalPuppyCard
              key={i}
              index={i}
              profile={profile}
              onChange={(data) => updateAdditionalPuppy(i, data)}
            />
          ))}
        </div>
      )}

      {/* Fee total + lock */}
      <div className="flex items-center justify-between pt-2 border-t border-primary/15">
        <div className="flex items-center gap-2 text-primary">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-semibold">Consultation fee · paid now</span>
        </div>
        <span className="font-mono font-bold text-2xl text-primary">NZD ${totalFee}</span>
      </div>

      {/* What's included toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-textMuted flex items-center gap-1 hover:text-primary transition-colors"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        What does this include?
      </button>
      {expanded && (
        <ul className="space-y-1.5">
          {CONSULTATION_FEE.includes.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-textSecondary">
              <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Step6Review() {
  const navigate = useNavigate()
  const {
    dogProfile,
    numberOfPuppies,
    getOrderTotals,
    consultPaid,
  } = useIntakeStore()

  // Already paid — send directly to plan (prevent back-navigation into intake)
  useEffect(() => {
    if (consultPaid) navigate('/plan', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totals = getOrderTotals()
  const puppyName = dogProfile.name || 'your puppy'

  const handlePayConsult = () => {
    const origin = window.location.origin
    const successUrl = `${origin}/plan?paid=1&puppy=${encodeURIComponent(puppyName)}`
    const cancelUrl = `${origin}/intake/review`

    const params = new URLSearchParams({
      mode: 'consult',
      puppy: puppyName,
      puppyCount: numberOfPuppies.toString(),
      total: totals.consultation.toString(),
      consult: totals.consultation.toString(),
      successUrl,
      cancelUrl,
    })
    navigate(`/checkout?${params.toString()}`)
  }

  return (
    <IntakeLayout>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">
          Start your puppy's programme
        </h1>
        <p className="text-textSecondary">
          Your consultation fee covers everything needed to build and authorise your personalised vaccination plan.
        </p>
      </div>

      {/* Puppy profile pill */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-bg rounded-card border border-border">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl flex-shrink-0">🐕</div>
        <div>
          <p className="font-bold text-textPrimary">{puppyName}</p>
          <p className="text-textMuted text-xs">
            {dogProfile.breed}{dogProfile.breed && dogProfile.sex ? ' · ' : ''}{dogProfile.sex}
            {dogProfile.weight_kg ? ` · ${dogProfile.weight_kg}kg` : ''}
          </p>
        </div>
        <Link to="/intake" className="ml-auto text-xs text-primary hover:underline flex-shrink-0">Edit</Link>
      </div>

      {/* Consultation fee block */}
      <div className="mb-6">
        <ConsultFeeBlock />
      </div>

      {/* What happens after payment */}
      <div className="mb-6 bg-white border border-border rounded-card-lg p-5">
        <SectionHeading
          label="What happens after you pay"
          sublabel="Your plan is built, reviewed, and ready — all before we confirm anything."
        />
        <div className="space-y-4">
          {[
            {
              icon: Stethoscope,
              label: 'AI health assessment',
              detail: `Our AI reviews ${numberOfPuppies > 1 ? 'each puppy\'s' : puppyName + '\'s'} age, breed, history, and lifestyle to design the right vaccination programme.`,
            },
            {
              icon: Shield,
              label: 'Vet review and authorisation',
              detail: 'A NZ-registered veterinarian reviews and signs off your plan before any vaccines are confirmed.',
            },
            {
              icon: FileText,
              label: 'Your personalised plan',
              detail: 'You\'ll see the recommended vaccines, the schedule, and the total cost — and you choose how to proceed.',
            },
            {
              icon: Clock,
              label: 'On your terms',
              detail: 'Nothing is dispatched and nothing is booked until you confirm. You are in control at every step.',
            },
          ].map(({ icon: Icon, label, detail }) => (
            <div key={label} className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-textPrimary">{label}</p>
                <p className="text-sm text-textSecondary mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pay CTA */}
      <Button fullWidth size="lg" onClick={handlePayConsult}>
        Pay NZD ${totals.consultation} — See your plan →
      </Button>

      <div className="flex items-center justify-center gap-4 text-xs text-textMuted mt-4">
        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secured by Stripe</span>
        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 256-bit TLS</span>
        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> NZD · no conversion</span>
      </div>
    </IntakeLayout>
  )
}
