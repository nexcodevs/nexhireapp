'use client'

import { InputHTMLAttributes, ReactNode, forwardRef, useId, useState } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  iconLeft?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, iconLeft, className = '', id: idProp, type = 'text', ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    const describedBy = error ? errorId : hint ? hintId : undefined

    const isPassword = type === 'password'
    const [revealed, setRevealed] = useState(false)
    const effectiveType = isPassword && revealed ? 'text' : type

    const inputClasses = [
      'nx-input',
      iconLeft ? 'nx-input--has-icon' : '',
      isPassword ? 'nx-input--password' : '',
      error ? 'nx-input--error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-2)',
              letterSpacing: '-0.005em',
            }}
          >
            {label}
            {props.required && (
              <span aria-hidden="true" style={{ color: 'var(--rose-500)', marginLeft: '2px' }}>
                *
              </span>
            )}
          </label>
        )}

        <div className="nx-input-wrap">
          {iconLeft && <span className="nx-input-wrap__icon">{iconLeft}</span>}
          <input
            ref={ref}
            id={id}
            type={effectiveType}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={props.required || undefined}
            className={inputClasses}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed(r => !r)}
              aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={revealed}
              tabIndex={0}
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '6px',
                color: 'var(--text-4)',
                background: 'transparent',
                cursor: 'pointer',
                border: 'none',
              }}
              className="nx-input__reveal"
            >
              {revealed ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 5.09A10.97 10.97 0 0112 5c5.52 0 9.74 4.46 10.93 6.66.13.21.13.47 0 .68a13.61 13.61 0 01-3.59 4.21M6.61 6.61A13.6 13.6 0 001.07 11.66a.68.68 0 000 .68C2.26 14.54 6.48 19 12 19c1.74 0 3.36-.46 4.79-1.18" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1.07 11.66a.68.68 0 010-.68C2.26 8.46 6.48 4 12 4s9.74 4.46 10.93 6.66c.13.21.13.47 0 .68C21.74 13.54 17.52 18 12 18S2.26 13.54 1.07 11.66z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            style={{ fontSize: '11px', color: 'var(--danger-text)', marginTop: '2px' }}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={hintId}
            style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}
          >
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
