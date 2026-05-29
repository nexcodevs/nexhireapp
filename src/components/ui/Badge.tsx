interface BadgeProps {
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'cyan' | 'gray' | 'dark' | 'neon'
  size?: 'sm' | 'md' | 'lg'
  live?: boolean
  children: React.ReactNode
  className?: string
}

export default function Badge({
  variant = 'gray',
  size = 'md',
  live = false,
  children,
  className = '',
}: BadgeProps) {
  const classes = [
    'nx-badge',
    `nx-badge--${variant}`,
    `nx-badge--${size}`,
    live ? 'nx-badge--live' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{children}</span>
}
