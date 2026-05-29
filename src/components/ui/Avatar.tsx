type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type AvatarVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface AvatarProps {
  name?: string
  size?: AvatarSize
  variant?: AvatarVariant
  status?: boolean
  className?: string
  title?: string
  'aria-label'?: string
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '??'
  )
}

function hashVariant(name: string): AvatarVariant {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return (((Math.abs(hash) % 7) + 1) as AvatarVariant)
}

export default function Avatar({
  name = '',
  size = 'md',
  variant,
  status = false,
  className = '',
  title,
  'aria-label': ariaLabel,
}: AvatarProps) {
  const resolvedVariant: AvatarVariant = variant ?? (name ? hashVariant(name) : 1)
  const classes = [
    'nx-avatar',
    `nx-avatar--${size}`,
    `nx-avatar--g${resolvedVariant}`,
    status ? 'nx-avatar--status' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      title={title}
      aria-label={ariaLabel ?? (name ? `Avatar de ${name}` : 'Avatar')}
    >
      {initialsOf(name)}
    </div>
  )
}
