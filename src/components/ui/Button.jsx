import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark hover:shadow-card-hover',
  secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white',
  accent: 'bg-accent text-white hover:bg-accent-dark hover:shadow-card-hover',
  outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary/5',
  ghost: 'bg-transparent text-primary hover:bg-primary/10',
  danger: 'bg-error text-white hover:bg-red-700',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-body font-semibold rounded-card
        transition-all duration-200 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
