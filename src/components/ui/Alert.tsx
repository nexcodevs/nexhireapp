type AlertVariant = 'success' | 'warning' | 'danger' | 'info'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: React.ReactNode
  className?: string
}

function defaultIcon(variant: AlertVariant) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (variant) {
    case 'success':
      return (
        <svg {...common}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...common}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'danger':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
  }
}

export default function Alert({
  variant = 'info',
  title,
  children,
  className = '',
}: AlertProps) {
  return (
    <div className={`nx-alert nx-alert--${variant} ${className}`.trim()} role="alert">
      <span className="nx-alert__icon">{defaultIcon(variant)}</span>
      <div className="nx-alert__body">
        {title && <div className="nx-alert__title">{title}</div>}
        {children && <div className="nx-alert__msg">{children}</div>}
      </div>
    </div>
  )
}
