interface FormErrorProps {
  children: React.ReactNode
}

export default function FormError({ children }: FormErrorProps) {
  return (
    <p
      role="alert"
      style={{
        fontSize: '13px',
        color: '#991B1B',
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: '8px',
        padding: '8px 12px',
      }}
    >
      {children}
    </p>
  )
}
