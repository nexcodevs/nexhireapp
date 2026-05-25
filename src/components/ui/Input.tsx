import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#374151]">
            {label}
            {props.required && <span className="text-[#16A34A] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full h-10 px-3 rounded-lg border bg-white text-[#052E16] text-sm
            placeholder:text-[#9CA3AF]
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent
            disabled:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60
            ${error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-[#E5E7EB] hover:border-[#BBF7D0]'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#9CA3AF]">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input