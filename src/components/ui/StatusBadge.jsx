const statuses = {
  pending: { label: 'Pending', bg: 'bg-gray-100', text: 'text-gray-700' },
  paid: { label: 'Paid', bg: 'bg-success/10', text: 'text-green-800' },
  processing: { label: 'Processing', bg: 'bg-blue-50', text: 'text-blue-700' },
  shipped: { label: 'Shipped', bg: 'bg-primary/10', text: 'text-primary' },
  delivered: { label: 'Delivered', bg: 'bg-success/10', text: 'text-green-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-error/10', text: 'text-red-700' },
  refunded: { label: 'Refunded', bg: 'bg-gray-100', text: 'text-gray-700' },
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-700' },
  administered: { label: 'Administered', bg: 'bg-success/10', text: 'text-green-800' },
  overdue: { label: 'Overdue', bg: 'bg-warning/10', text: 'text-amber-700' },
  approved: { label: 'Approved', bg: 'bg-success/10', text: 'text-green-800' },
  rejected: { label: 'Referred', bg: 'bg-error/10', text: 'text-red-700' },
  vet_review: { label: 'Vet Review', bg: 'bg-warning/10', text: 'text-amber-700' },
  ai_complete: { label: 'AI Complete', bg: 'bg-blue-50', text: 'text-blue-700' },
}

export default function StatusBadge({ status, className = '' }) {
  const config = statuses[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  )
}
