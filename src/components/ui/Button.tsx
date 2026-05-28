import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'neon' | 'dark' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const sizes: Record<string, React.CSSProperties> = {
  sm: { height: '36px', padding: '0 16px', fontSize: '13px' },
  md: { height: '42px', padding: '0 20px', fontSize: '13.5px' },
  lg: { height: '50px', padding: '0 28px', fontSize: '15px' },
}

const variants: Record<string, React.CSSProperties> = {
  primary: {
    background: 'var(--color-f900)',
    color: '#ffffff',
    border: 'none',
    boxShadow: 'var(--shadow-sg)',
  },
  dark: {
    background: 'var(--color-f900)',
    color: '#ffffff',
    border: 'none',
    boxShadow: 'var(--shadow-sg)',
  },
  neon: {
    background: 'var(--color-neon)',
    color: 'var(--color-f900)',
    border: 'none',
    fontWeight: 600,
  },
  secondary: {
    background: 'var(--color-surf)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  outline: {
    background: 'transparent',
    color: 'var(--color-text)',
    border: '1.5px solid var(--color-border2)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-muted)',
    border: 'none',
  },
  danger: {
    background: '#FEF2F2',
    color: '#991B1B',
    border: '1px solid #FECACA',
  },
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className = '', style, ...props }, ref) => {
    const variantClass = `btn-v-${variant}`
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`btn-base ${variantClass} ${className}`}
        style={{
          ...sizes[size],
          ...variants[variant],
          ...style,
        }}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin"
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              style={{ opacity: 0.25 }}
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              style={{ opacity: 0.75 }}
            />
          </svg>
        ) : null}
        {children}

        <style>{`
          .btn-base {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 999px;
            font-family: var(--font-sans);
            font-weight: 500;
            letter-spacing: -0.01em;
            cursor: pointer;
            transition: all 0.18s cubic-bezier(.16, 1, .3, 1);
            white-space: nowrap;
          }
          .btn-base:active:not(:disabled) {
            transform: scale(0.97);
          }
          .btn-base:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-v-primary:hover:not(:disabled),
          .btn-v-dark:hover:not(:disabled) {
            background: var(--color-f800) !important;
            transform: translateY(-1px);
            box-shadow: 0 12px 36px rgba(7, 61, 44, .28) !important;
          }

          .btn-v-neon:hover:not(:disabled) {
            background: #00D166 !important;
            transform: translateY(-1px);
            box-shadow: var(--shadow-neon) !important;
          }

          .btn-v-secondary:hover:not(:disabled) {
            background: var(--color-m100) !important;
            border-color: var(--color-border-g) !important;
          }

          .btn-v-outline:hover:not(:disabled) {
            background: var(--color-m100) !important;
            border-color: var(--color-border-g) !important;
            transform: translateY(-1px);
          }

          .btn-v-ghost:hover:not(:disabled) {
            background: var(--color-m100) !important;
            color: var(--color-text) !important;
          }

          .btn-v-danger:hover:not(:disabled) {
            background: #FEE2E2 !important;
            border-color: #FCA5A5 !important;
          }
        `}</style>
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button