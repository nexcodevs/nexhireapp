interface BadgeProps {
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'dark' | 'neon'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export default function Badge({
  variant = 'gray',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const variants: Record<string, React.CSSProperties> = {
    green: {
      background: 'var(--color-m100)',
      color: 'var(--color-f800)',
      border: '1px solid var(--color-border-g)',
    },
    yellow: {
      background: '#FFFBEB',
      color: '#92400E',
      border: '1px solid #FDE68A',
    },
    red: {
      background: '#FEF2F2',
      color: '#991B1B',
      border: '1px solid #FECACA',
    },
    blue: {
      background: '#EFF6FF',
      color: '#1E40AF',
      border: '1px solid #DBEAFE',
    },
    gray: {
      background: '#F3F4F6',
      color: 'var(--color-muted)',
      border: '1px solid var(--color-border)',
    },
    dark: {
      background: 'var(--color-f900)',
      color: 'var(--color-neon)',
      border: '1px solid var(--color-f800)',
    },
    neon: {
      background: 'rgba(0,230,118,.12)',
      color: 'var(--color-f900)',
      border: '1px solid rgba(0,230,118,.35)',
      fontWeight: 600,
    },
  }

  const sizes = {
    sm: { padding: '2px 8px', fontSize: '10.5px' },
    md: { padding: '3px 10px', fontSize: '11px' },
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full whitespace-nowrap ${className}`}
      style={{
        ...variants[variant],
        ...sizes[size],
        fontWeight: variant === 'neon' ? 600 : 500,
        letterSpacing: '-0.005em',
      }}
    >
      {children}
    </span>
  )
}