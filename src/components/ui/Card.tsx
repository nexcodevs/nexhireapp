import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'mint' | 'dark' | 'glass' | 'flat'
  hover?: boolean
}

export default function Card({
  padding = 'md',
  variant = 'default',
  hover = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const classes = [
    'nx-card',
    `nx-card--${variant}`,
    `nx-card--padding-${padding}`,
    hover ? 'nx-card--hover' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}
