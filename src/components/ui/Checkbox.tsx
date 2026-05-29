import { InputHTMLAttributes, forwardRef, useId } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id: idProp, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId

    return (
      <label
        htmlFor={id}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={`nx-checkbox ${className}`.trim()}
          {...props}
        />
        {label && (
          <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{label}</span>
        )}
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'
export default Checkbox
