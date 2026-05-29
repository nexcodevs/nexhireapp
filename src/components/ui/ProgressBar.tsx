type ProgressColor = 'green' | 'purple' | 'amber'
type ProgressThickness = 'thin' | 'normal' | 'thick'

interface ProgressBarProps {
  value: number
  max?: number
  color?: ProgressColor
  thickness?: ProgressThickness
  ariaLabel?: string
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  color = 'green',
  thickness = 'normal',
  ariaLabel,
  className = '',
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const trackClass = [
    'nx-progress',
    thickness === 'thick' ? 'nx-progress--thick' : '',
    thickness === 'thin' ? 'nx-progress--thin' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const fillClass = [
    'nx-progress__fill',
    color === 'purple' ? 'nx-progress__fill--purple' : '',
    color === 'amber' ? 'nx-progress__fill--amber' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={trackClass}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
    >
      <div className={fillClass} style={{ width: `${pct}%` }} />
    </div>
  )
}
