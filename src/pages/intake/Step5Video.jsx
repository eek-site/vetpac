import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, Upload, CheckCircle, RefreshCw, HelpCircle, Play, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import IntakeLayout from '../../components/layout/IntakeLayout'
import { useIntakeStore } from '../../store/intakeStore'
import { supabase } from '../../lib/supabase'

const VIDEO_GUIDES = [
  { label: 'Walk', icon: '🐕', desc: 'Dog walking naturally (5–10 sec)' },
  { label: 'Face', icon: '👀', desc: 'Close up on eyes and nose (5 sec)' },
  { label: 'Left side', icon: '◀️', desc: 'Full body from left (5 sec)' },
  { label: 'Right side', icon: '▶️', desc: 'Full body from right (5 sec)' },
]

export default function Step5Video() {
  const navigate = useNavigate()
  const { videoUrl, setVideoUrl, setVideoFile, dogProfile } = useIntakeStore()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [localPreview, setLocalPreview] = useState(null)
  const fileRef = useRef(null)
  const dropRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    const validTypes = ['video/mp4', 'video/quicktime', 'video/hevc']
    const isValid = validTypes.some(() => file.type.startsWith('video/'))
    if (!isValid) { setError('Please upload an MP4, MOV, or HEVC video file.'); return }
    if (file.size > 100 * 1024 * 1024) { setError('Video must be under 100MB.'); return }

    setError(null)
    setUploading(true)
    setProgress(0)
    setLocalPreview(URL.createObjectURL(file))
    setVideoFile(file)

    const fileName = `dog-videos/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`
    const { error: uploadError } = await supabase.storage.from('dog-videos').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      setError('Upload failed. Please try again. (' + uploadError.message + ')')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('dog-videos').getPublicUrl(fileName)
    setVideoUrl(publicUrl)
    setUploading(false)
    setProgress(100)
  }, [setVideoUrl, setVideoFile])

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleContinue = () => {
    if (!videoUrl && !localPreview) { setError('Please upload a video before continuing.'); return }
    navigate('/intake/review')
  }

  const reset = () => {
    setLocalPreview(null)
    setVideoUrl(null)
    setProgress(0)
    setError(null)
  }

  return (
    <IntakeLayout>
      <div className="mb-8">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <Video className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">Record your dog</h1>
            <p className="text-textSecondary">A short 60–90 second video helps our vet assess {dogProfile.name || 'your dog'}'s health.</p>
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 text-sm text-primary hover:text-primary-light transition-colors font-medium mt-1"
          >
            <HelpCircle className="w-4 h-4" />
            Why?
          </button>
        </div>
      </div>

      {/* Video angle guides */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {VIDEO_GUIDES.map((g) => (
          <div key={g.label} className="text-center p-3 bg-bg rounded-card border border-border">
            <div className="text-2xl mb-1">{g.icon}</div>
            <p className="font-semibold text-xs text-textPrimary">{g.label}</p>
            <p className="text-xs text-textMuted mt-0.5 leading-tight">{g.desc}</p>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      {!localPreview && !videoUrl ? (
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-card-lg p-12 text-center cursor-pointer hover:border-primary-light hover:bg-primary/5 transition-all duration-200 group"
        >
          <Upload className="w-12 h-12 text-textMuted group-hover:text-primary mx-auto mb-4 transition-colors" />
          <p className="font-semibold text-textPrimary mb-1">Drop your video here</p>
          <p className="text-textMuted text-sm mb-4">or tap to select from your camera roll</p>
          <Button variant="secondary" size="sm" type="button">
            Choose video
          </Button>
          <p className="text-xs text-textMuted mt-4">MP4, MOV or HEVC • Max 100MB • 30–180 seconds</p>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/quicktime,video/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-card-lg overflow-hidden bg-black aspect-video">
            {localPreview && (
              <video src={localPreview} controls className="w-full h-full object-contain" />
            )}
            {!uploading && (
              <button
                onClick={reset}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-textSecondary font-medium">Uploading...</span>
                <span className="text-textMuted">{progress}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary-light rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {videoUrl && !uploading && (
            <div className="flex items-center gap-3 p-4 bg-success/10 rounded-card border border-success/20">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Video uploaded successfully</p>
                <p className="text-green-700 text-xs">Ready for vet review</p>
              </div>
              <button onClick={reset} className="ml-auto text-xs text-green-700 hover:text-green-900 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Re-upload
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="mt-8">
        <Button
          type="button"
          fullWidth
          size="lg"
          onClick={handleContinue}
          disabled={uploading}
          loading={uploading}
        >
          {videoUrl ? 'Continue to Review →' : 'Skip for now (vet may request later)'}
        </Button>
        {!videoUrl && (
          <p className="text-xs text-textMuted text-center mt-2">A video is strongly recommended for vet approval</p>
        )}
      </div>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Why do we need a video?">
        <div className="space-y-4 text-sm text-textSecondary leading-relaxed">
          <p>The 60–90 second video is a key part of the reviewing vet's assessment. It allows them to evaluate:</p>
          <ul className="space-y-2">
            {[
              'Your dog\'s mobility — are they moving freely without lameness?',
              'Eyes and nose — any discharge or visible concerns?',
              'General coat condition and body weight',
              'Activity level and demeanour',
              'Any visible wounds, swelling, or abnormalities',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="font-medium text-textPrimary">This is what allows the vet to issue a VOI with confidence, without needing a physical clinic visit.</p>
          <p>It takes about 2 minutes to record. Just follow the four angle guides shown above.</p>
        </div>
      </Modal>
    </IntakeLayout>
  )
}
