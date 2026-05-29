import { SelectHTMLAttributes, forwardRef, useId } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className = '', id: idProp, children, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    const describedBy = error ? errorId : hint ? hintId : undefined

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

        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={props.required || undefined}
          className={`nx-select ${className}`.trim()}
          {...props}
        >
          {children}
        </select>

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

Select.displayName = 'Select'
export default Select
