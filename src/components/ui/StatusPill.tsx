type StatusKind = 'recommended' | 'review' | 'interview' | 'client' | 'hired' | 'rejected'

interface StatusPillProps {
  kind: StatusKind
  children: React.ReactNode
  className?: string
}

export default function StatusPill({ kind, children, className = '' }: StatusPillProps) {
  return (
    <span className={`nx-status nx-status--${kind} ${className}`.trim()}>{children}</span>
  )
}
