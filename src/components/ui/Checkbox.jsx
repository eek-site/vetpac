import { Check } from 'lucide-react'

export default function Checkbox({ label, checked, onChange, error, required }) {
  return (
    <div className="space-y-1">
      <label className="flex items-start gap-3 cursor-pointer group">
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`
            w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
            ${checked ? 'bg-primary border-primary' : 'bg-white border-border group-hover:border-primary-light'}
          `}
        >
          {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
        </button>
        <span className="text-sm text-textSecondary leading-relaxed">
          {label}{required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      {error && <p className="text-sm text-error ml-8">{error}</p>}
    </div>
  )
}
