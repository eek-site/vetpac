import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

const types = {
  success: { icon: CheckCircle, bg: 'bg-success/10', border: 'border-success/30', text: 'text-green-800', icon_color: 'text-success' },
  warning: { icon: AlertTriangle, bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-amber-800', icon_color: 'text-warning' },
  error: { icon: XCircle, bg: 'bg-error/10', border: 'border-error/30', text: 'text-red-800', icon_color: 'text-error' },
  info: { icon: Info, bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary-dark', icon_color: 'text-primary' },
}

export default function Alert({ type = 'info', title, children }) {
  const { icon: Icon, bg, border, text, icon_color } = types[type]
  return (
    <div className={`rounded-card border p-4 flex gap-3 ${bg} ${border}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${icon_color}`} />
      <div className={text}>
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
