import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant =
  | 'primary'
  | 'neon'
  | 'glass'
  | 'ghost'
  | 'outline'
  | 'danger'
  // aliases v1 — mapeados internamente
  | 'dark'
  | 'secondary'

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconOnly?: boolean
  iconEnd?: boolean
}

const normalizeVariant = (v: ButtonVariant): Exclude<ButtonVariant, 'dark' | 'secondary'> => {
  if (v === 'dark') return 'primary'
  if (v === 'secondary') return 'glass'
  return v
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      iconOnly = false,
      iconEnd = false,
      children,
      className = '',
      ...props
    },
    ref,
  ) => {
    const v = normalizeVariant(variant)

    const classes = [
      'nx-btn',
      `nx-btn--${v}`,
      `nx-btn--size-${size}`,
      iconOnly ? 'nx-btn--icon' : '',
      iconEnd ? 'nx-btn--icon-end' : '',
      loading ? 'nx-btn--loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {!loading && children}
        {loading && <span className="nx-btn__spinner" aria-hidden />}
        {loading && (
          <span style={{ opacity: 0.6 }}>{children}</span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
