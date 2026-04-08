export default function RadioGroup({ label, name, options = [], value, onChange, error, required, inline = false }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-textSecondary">
          {label}{required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className={`${inline ? 'flex flex-wrap gap-3' : 'space-y-2'}`}>
        {options.map((opt) => {
          const optValue = opt.value ?? opt
          const optLabel = opt.label ?? opt
          const checked = value === optValue
          return (
            <label
              key={optValue}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-card border-2 cursor-pointer transition-all duration-200
                ${checked
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-white text-textPrimary hover:border-primary-light'
                }
                ${inline ? 'flex-1 min-w-0' : 'w-full'}
              `}
            >
              <input
                type="radio"
                name={name}
                value={optValue}
                checked={checked}
                onChange={() => onChange(optValue)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                ${checked ? 'border-primary' : 'border-border'}`}
              >
                {checked && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className="font-medium text-sm">{optLabel}</span>
            </label>
          )
        })}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}
