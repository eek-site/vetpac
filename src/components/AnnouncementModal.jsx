import { useState, useEffect } from 'react'
import { X, AlertTriangle, Megaphone } from 'lucide-react'

const SEEN_KEY = 'vetpac_ann_seen'

function getSeenIds() {
  try { return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]')) } catch { return new Set() }
}
function markSeen(id) {
  const s = getSeenIds(); s.add(id)
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...s]))
}

function isEmergency(title) {
  return /⚠|suspend|emerg|warning|civil defence|cyclone|flood|evacuate/i.test(title)
}

export default function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState(null)
  const [visible, setVisible]           = useState(false)

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(d => {
        const active = (d.announcements || []).find(a => !getSeenIds().has(a.id))
        if (active) { setAnnouncement(active); setVisible(true) }
      })
      .catch(() => {})
  }, [])

  const dismiss = () => {
    if (announcement) markSeen(announcement.id)
    setVisible(false)
  }

  if (!visible || !announcement) return null

  const emergency = isEmergency(announcement.title)
  const lines = announcement.body.split('\n').filter(Boolean)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
        emergency ? 'bg-white' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 flex items-start gap-3 ${
          emergency ? 'bg-red-600' : 'bg-primary'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            {emergency
              ? <AlertTriangle className="w-5 h-5 text-white" />
              : <Megaphone className="w-5 h-5 text-white" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
              emergency ? 'text-red-200' : 'text-white/60'
            }`}>
              {emergency ? 'Important Notice' : 'Announcement'}
            </p>
            <h2 className="font-display font-bold text-lg text-white leading-tight">
              {announcement.title}
            </h2>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors ml-2"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3 max-h-80 overflow-y-auto">
          {lines.map((line, i) => (
            <p key={i} className="text-sm text-slate-700 leading-relaxed">{line}</p>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {new Date(announcement.start_at).toLocaleDateString('en-NZ', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          <button
            onClick={dismiss}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${
              emergency ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}
