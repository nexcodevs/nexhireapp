import { InputHTMLAttributes, forwardRef, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id: idProp, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    const describedBy = error ? errorId : hint ? hintId : undefined

    const inputClasses = [
      'nx-input',
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
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text2)',
            }}
          >
            {label}
            {props.required && (
              <span aria-hidden="true" style={{ color: '#991B1B', marginLeft: '4px' }}>
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={props.required || undefined}
          className={inputClasses}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            style={{ fontSize: '12px', color: '#991B1B', marginTop: '2px' }}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={hintId}
            style={{ fontSize: '12px', color: 'var(--color-subtle)', marginTop: '2px' }}
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
