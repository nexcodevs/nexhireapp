type SparkColor = 'green' | 'purple' | 'cyan' | 'amber'
type NumSize = 'sm' | 'md' | 'lg'

interface KPICardProps {
  label: string
  value: number | string
  unit?: string
  numSize?: NumSize
  trend?: { direction: 'up' | 'down'; value: string }
  footer?: React.ReactNode
  spark?: { values: number[]; color?: SparkColor }
  className?: string
}

function clamp(n: number): number {
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}

export default function KPICard({
  label,
  value,
  unit,
  numSize = 'md',
  trend,
  footer,
  spark,
  className = '',
}: KPICardProps) {
  const numClass = numSize === 'sm' ? 'nx-kpi__num--sm' : numSize === 'lg' ? 'nx-kpi__num--lg' : ''

  return (
    <div className={`nx-kpi ${className}`.trim()}>
      <div className="nx-kpi__label">
        <span>{label}</span>
        {trend && (
          <span
            className={`nx-kpi__trend ${trend.direction === 'down' ? 'nx-kpi__trend--down' : ''}`.trim()}
            aria-label={`Tendência ${trend.direction === 'up' ? 'positiva' : 'negativa'}: ${trend.value}`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div className={`nx-kpi__num ${numClass}`.trim()}>
        {value}
        {unit && <span className="nx-kpi__unit">{unit}</span>}
      </div>
      {spark && (
        <div className={`nx-kpi__spark nx-kpi__spark--${spark.color ?? 'green'}`} aria-hidden>
          {spark.values.map((v, i) => (
            <span
              key={i}
              style={{
                height: `${clamp(v)}%`,
                opacity: i === spark.values.length - 1 ? 1 : 0.7,
              }}
            />
          ))}
        </div>
      )}
      {footer && <div className="nx-kpi__footer">{footer}</div>}
    </div>
  )
}
