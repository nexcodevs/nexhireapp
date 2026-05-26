interface BadgeProps {
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'dark'
  children: React.ReactNode
  className?: string
}

const variants = {
  green: 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]',
  yellow: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  red: 'bg-red-50 text-red-600 border border-red-200',
  blue: 'bg-blue-50 text-blue-600 border border-blue-200',
  gray: 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]',
  dark: 'bg-[#052E16] text-[#00E676] border border-[#064E1F]',
}

export default function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}