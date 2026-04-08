import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Video, User, PawPrint, FileText, ChevronRight, Clock, Eye } from 'lucide-react'
import Nav from '../components/layout/Nav'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Textarea from '../components/ui/Textarea'
import RadioGroup from '../components/ui/RadioGroup'
import Card from '../components/ui/Card'

const mockQueue = [
  {
    id: '1',
    dog: { name: 'Bella', breed: 'Labrador Retriever', age: '14 weeks', sex: 'Female', weight: '8.2kg' },
    owner: { name: 'Sarah Mitchell', region: 'Auckland', dob: '15 Mar 1988' },
    submitted: '2 mins ago',
    aiFlags: 0,
    status: 'ai_complete',
    video: null,
    intake: { currently_ill: 'no', prior_vaccine_reaction: 'no', activity_level: 'yes', living_environment: 'urban', dog_parks_boarding: 'sometimes' },
    aiAssessment: {
      eligible: true,
      flag_for_vet_review: false,
      flags: [],
      treatment_plan: {
        dog_summary: 'Bella is a 14-week-old female Labrador Retriever weighing 8.2kg. She is undesexed and in good health.',
        health_status_assessment: 'Dog appears healthy based on owner responses. Active and playful, eating normally. No signs of illness. No prior vaccine reactions or known health conditions.',
        recommended_products: [{ dose_number: 1, product_name: 'Vanguard Plus 5 (C5)', dose_ml: 1.0, route: 'subcutaneous injection', site: 'scruff of neck' }],
        leptospirosis_recommended: false,
        kennel_cough_recommended: true,
        kennel_cough_reason: 'Dog visits dog parks and daycare sometimes — kennel cough vaccination recommended.',
        vet_notes: 'Straightforward puppy vaccination case. All contraindications checked and cleared. Owner is Auckland-based, urban environment. Recommend proceeding with C5 course. Suggest owner also consider kennel cough vaccine given social exposure.',
        owner_instructions: 'You will receive your C5 vaccine in cold-chain packaging. Follow the enclosed guide and video instructions carefully.',
      },
    },
  },
  {
    id: '2',
    dog: { name: 'Bruno', breed: 'German Shepherd', age: '10 weeks', sex: 'Male', weight: '6.8kg' },
    owner: { name: 'Tom Karaka', region: 'Wellington', dob: '22 Jun 1990' },
    submitted: '18 mins ago',
    aiFlags: 1,
    status: 'ai_complete',
    video: null,
    intake: { currently_ill: 'no', prior_vaccine_reaction: 'unknown', activity_level: 'normal', living_environment: 'rural' },
    aiAssessment: {
      eligible: true,
      flag_for_vet_review: true,
      flags: ['Prior vaccine reaction unknown — owner could not confirm. Flag for vet awareness.'],
      treatment_plan: {
        dog_summary: '10-week-old male German Shepherd, 6.8kg. Rural environment, no livestock contact confirmed.',
        health_status_assessment: 'Dog appears healthy. One flag raised: prior vaccine reaction history unknown. No current illness signs.',
        recommended_products: [],
        leptospirosis_recommended: true,
        leptospirosis_reason: 'Rural environment — leptospirosis risk elevated.',
        vet_notes: 'Unknown prior vaccine history. Owner reports dog never visibly reacted to anything but cannot confirm vaccination history. Recommend proceeding with C5 with standard observation protocol. Consider leptospirosis given rural location.',
        owner_instructions: 'Standard puppy vaccination course recommended.',
      },
    },
  },
]

function QueueItem({ intake, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-card border-2 transition-all duration-200 hover:border-primary-light
        ${selected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:bg-bg'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">🐕</div>
          <div>
            <p className="font-semibold text-textPrimary">{intake.dog.name}</p>
            <p className="text-textMuted text-xs">{intake.dog.breed} • {intake.dog.age} • {intake.owner.region}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={intake.status} />
          {intake.aiFlags > 0 && (
            <span className="text-xs bg-warning/10 text-amber-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {intake.aiFlags} flag
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-textMuted mt-2 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Submitted {intake.submitted}
      </p>
    </button>
  )
}

function ReviewPanel({ intake, onDecision }) {
  const [decision, setDecision] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!decision) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1500))
    setSubmitting(false)
    setSubmitted(true)
    onDecision(intake.id, decision)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CheckCircle className="w-12 h-12 text-success" />
        <p className="font-semibold text-textPrimary text-lg">Decision submitted</p>
        <p className="text-textMuted text-sm">Owner has been notified. {decision === 'approved' ? 'VOI generated and dispatching.' : 'Referral email sent.'}</p>
      </div>
    )
  }

  const ai = intake.aiAssessment
  const plan = ai?.treatment_plan

  return (
    <div className="space-y-6 overflow-y-auto">
      {/* Dog & Owner Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg rounded-card p-4">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-1"><PawPrint className="w-3 h-3" /> Dog</p>
          <p className="font-bold text-textPrimary">{intake.dog.name}</p>
          <p className="text-sm text-textMuted">{intake.dog.breed}</p>
          <p className="text-sm text-textMuted">{intake.dog.age} • {intake.dog.sex} • {intake.dog.weight}</p>
        </div>
        <div className="bg-bg rounded-card p-4">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-1"><User className="w-3 h-3" /> Owner (VOI subject)</p>
          <p className="font-bold text-textPrimary">{intake.owner.name}</p>
          <p className="text-sm text-textMuted">DOB: {intake.owner.dob}</p>
          <p className="text-sm text-textMuted">{intake.owner.region}</p>
        </div>
      </div>

      {/* AI Flags */}
      {ai?.flags?.length > 0 && (
        <Alert type="warning" title="AI flags for vet review">
          <ul className="list-disc list-inside space-y-1">
            {ai.flags.map((flag, i) => <li key={i}>{flag}</li>)}
          </ul>
        </Alert>
      )}

      {!ai?.flags?.length && (
        <Alert type="success" title="No AI flags">
          AI assessment found no concerns. Standard healthy dog presentation.
        </Alert>
      )}

      {/* AI Assessment */}
      {plan && (
        <div className="bg-bg rounded-card p-5 space-y-4">
          <p className="font-semibold text-textPrimary text-sm uppercase tracking-wider">AI Assessment</p>
          <div>
            <p className="text-xs font-semibold text-textMuted mb-1">Dog Summary</p>
            <p className="text-sm text-textSecondary">{plan.dog_summary}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-textMuted mb-1">Health Status</p>
            <p className="text-sm text-textSecondary">{plan.health_status_assessment}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-textMuted mb-1">Vet Notes from AI</p>
            <p className="text-sm text-textSecondary">{plan.vet_notes}</p>
          </div>
          {plan.kennel_cough_recommended && (
            <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
              <p className="text-xs font-semibold text-amber-700">💬 Kennel cough recommended</p>
              <p className="text-xs text-amber-600 mt-0.5">{plan.kennel_cough_reason}</p>
            </div>
          )}
          {plan.leptospirosis_recommended && (
            <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
              <p className="text-xs font-semibold text-amber-700">💬 Leptospirosis recommended</p>
              <p className="text-xs text-amber-600 mt-0.5">{plan.leptospirosis_reason}</p>
            </div>
          )}
        </div>
      )}

      {/* Video placeholder */}
      <div className="bg-black rounded-card aspect-video flex items-center justify-center">
        <div className="text-center text-white/50">
          <Video className="w-10 h-10 mx-auto mb-2" />
          <p className="text-sm">Dog video assessment</p>
          <p className="text-xs mt-1">Video player — secure stream from Supabase Storage</p>
        </div>
      </div>

      {/* Vet decision */}
      <div className="border-t border-border pt-6 space-y-4">
        <p className="font-semibold text-textPrimary">Your decision</p>
        <RadioGroup
          name="decision"
          options={[
            { value: 'approved', label: '✓ Approve — issue VOI and dispatch' },
            { value: 'needs_physical', label: '🏥 Request physical examination' },
            { value: 'rejected', label: '✗ Reject — refer to in-person vet' },
          ]}
          value={decision}
          onChange={setDecision}
        />
        <Textarea
          label="Vet notes"
          placeholder="Add any notes for the record or for the owner..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        <Button
          fullWidth
          size="lg"
          variant={decision === 'approved' ? 'primary' : decision === 'rejected' ? 'danger' : 'secondary'}
          onClick={handleSubmit}
          loading={submitting}
          disabled={!decision}
        >
          {decision === 'approved' && '✓ Approve & Issue VOI'}
          {decision === 'needs_physical' && '🏥 Request Physical Exam'}
          {decision === 'rejected' && '✗ Reject & Refer'}
          {!decision && 'Select a decision above'}
        </Button>
      </div>
    </div>
  )
}

export default function VetPortal() {
  const [selected, setSelected] = useState(mockQueue[0]?.id)
  const [queue, setQueue] = useState(mockQueue)

  const selectedIntake = queue.find((q) => q.id === selected)

  const handleDecision = (id, decision) => {
    setQueue((prev) => prev.map((q) => q.id === id ? { ...q, status: decision } : q))
  }

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <div className="max-w-content mx-auto px-4 sm:px-6 pt-24 pb-10">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-textPrimary">Vet Review Portal</h1>
              <p className="text-textMuted text-sm">Review intake assessments and issue VOIs</p>
            </div>
            <div className="bg-primary text-white text-sm px-4 py-2 rounded-full font-semibold">
              {queue.filter(q => q.status === 'ai_complete').length} awaiting review
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue */}
          <div className="lg:col-span-1 space-y-3">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-3">Queue</p>
            {queue.map((intake) => (
              <QueueItem
                key={intake.id}
                intake={intake}
                selected={selected === intake.id}
                onClick={() => setSelected(intake.id)}
              />
            ))}
          </div>

          {/* Review panel */}
          <div className="lg:col-span-2">
            {selectedIntake ? (
              <div className="bg-white rounded-card-lg shadow-card p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                  <div>
                    <h2 className="font-display font-semibold text-xl text-textPrimary">
                      Reviewing: {selectedIntake.dog.name}
                    </h2>
                    <p className="text-textMuted text-sm">Submitted {selectedIntake.submitted}</p>
                  </div>
                  <StatusBadge status={selectedIntake.status} />
                </div>
                <ReviewPanel intake={selectedIntake} onDecision={handleDecision} />
              </div>
            ) : (
              <div className="bg-white rounded-card-lg shadow-card p-12 text-center text-textMuted">
                <Eye className="w-12 h-12 mx-auto mb-4 text-border" />
                <p>Select an intake from the queue to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
