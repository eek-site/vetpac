import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

export function Select({ label, error, required, options = [], value, onChange, placeholder = 'Select...', className = '' }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-textSecondary">
          {label}{required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full border rounded-card px-4 py-3 font-body text-textPrimary bg-white appearance-none
          focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer
          ${error ? 'border-error focus:ring-error/20' : 'border-border focus:border-primary-light focus:ring-primary-light/20'}
          ${className}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}

export function SearchableSelect({ label, error, required, options = [], value, onChange, placeholder = 'Search breeds...' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
  const selected = value

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="space-y-1.5 relative" ref={ref}>
      {label && (
        <label className="block text-sm font-semibold text-textSecondary">
          {label}{required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-full border rounded-card px-4 py-3 font-body text-left flex items-center justify-between
          focus:outline-none focus:ring-2 transition-all duration-200 bg-white
          ${error ? 'border-error focus:ring-error/20' : 'border-border focus:border-primary-light focus:ring-primary-light/20'}
          ${selected ? 'text-textPrimary' : 'text-textMuted'}
        `}
      >
        <span>{selected || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-textMuted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 w-full bg-white border border-border rounded-card shadow-card-hover mt-1 max-h-64 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary-light"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-textMuted">No breeds found</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); setQuery('') }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-bg transition-colors
                    ${selected === opt ? 'text-primary font-semibold bg-primary/5' : 'text-textPrimary'}`}
                >
                  {opt}
                  {selected === opt && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}
