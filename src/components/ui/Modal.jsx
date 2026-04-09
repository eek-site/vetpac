import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-card-lg rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-textPrimary">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-bg flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-textMuted" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-5 text-sm text-textSecondary leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
