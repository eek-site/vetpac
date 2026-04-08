export default function Textarea({ label, error, helper, required, className = '', rows = 4, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-textSecondary">
          {label}{required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full border rounded-card px-4 py-3 font-body text-textPrimary
          placeholder-textMuted bg-white resize-none
          focus:outline-none focus:ring-2 transition-all duration-200
          ${error
            ? 'border-error focus:border-error focus:ring-error/20'
            : 'border-border focus:border-primary-light focus:ring-primary-light/20'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
      {helper && !error && <p className="text-sm text-textMuted">{helper}</p>}
    </div>
  )
}
