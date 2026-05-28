import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'none'
  variant?: 'default' | 'mint' | 'dark' | 'flat'
  hover?: boolean
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({
  padding = 'md',
  variant = 'default',
  hover = false,
  className = '',
  children,
  style,
  ...props
}: CardProps) {
  const baseStyles: React.CSSProperties = {
    borderRadius: 'var(--radius-xl)',
    transition: 'all 0.2s cubic-bezier(.16, 1, .3, 1)',
    ...(variant === 'default' && {
      background: 'var(--color-surf)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-s1)',
    }),
    ...(variant === 'mint' && {
      background: 'linear-gradient(135deg, var(--color-m100) 0%, #ffffff 100%)',
      border: '1px solid var(--color-border-g)',
      boxShadow: 'var(--shadow-s2)',
    }),
    ...(variant === 'dark' && {
      background: 'var(--color-f900)',
      border: '1px solid var(--color-f800)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-sg)',
    }),
    ...(variant === 'flat' && {
      background: 'var(--color-cream2)',
      border: '1px solid var(--color-border)',
    }),
    ...style,
  }

  return (
    <div
      className={`${paddings[padding]} ${hover ? 'card-hover' : ''} ${className}`}
      style={baseStyles}
      {...props}
    >
      {children}
      <style>{`
        .card-hover:hover {
          border-color: var(--color-border-g) !important;
          box-shadow: var(--shadow-s2) !important;
        }
      `}</style>
    </div>
  )
}