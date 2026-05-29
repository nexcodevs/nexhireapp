import { InputHTMLAttributes, forwardRef, useId } from 'react'

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
          type="radio"
          className={`nx-radio ${className}`.trim()}
          {...props}
        />
        {label && (
          <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{label}</span>
        )}
      </label>
    )
  },
)

Radio.displayName = 'Radio'
export default Radio
