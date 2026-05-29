interface FormErrorProps {
  children: React.ReactNode
}

export default function FormError({ children }: FormErrorProps) {
  return (
    <p
      role="alert"
      style={{
        fontSize: '12.5px',
        color: 'var(--danger-text)',
        background: 'var(--danger-bg)',
        border: '1px solid var(--danger-border)',
        borderRadius: 'var(--r-md)',
        padding: '10px 12px',
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  )
}
