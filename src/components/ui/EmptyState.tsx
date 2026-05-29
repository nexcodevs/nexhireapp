interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
  action?: React.ReactNode
  className?: string
}

const defaultIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
  </svg>
)

export default function EmptyState({
  icon,
  title,
  message,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`nx-empty ${className}`.trim()}>
      <div className="nx-empty__icon">{icon ?? defaultIcon}</div>
      <div className="nx-empty__title">{title}</div>
      {message && <div className="nx-empty__msg">{message}</div>}
      {action}
    </div>
  )
}
