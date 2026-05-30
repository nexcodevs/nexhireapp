interface SparklineProps {
  /** Array de valores. Mínimo 2 pontos. */
  values: number[]
  width?: number
  height?: number
  /** Cor da linha. Default = accent-text. */
  color?: string
  /** Mostra área sob a linha. */
  fill?: boolean
  className?: string
}

/**
 * Mini gráfico de linha pra usar em KPI cards e tendências.
 * SVG puro, sem dependências. Renderiza nada se < 2 pontos.
 */
export default function Sparkline({
  values,
  width = 80,
  height = 24,
  color = 'var(--accent-text)',
  fill = true,
  className,
}: SparklineProps) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  const points = values.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * height
    return [x, y] as const
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(' ')

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      {fill && (
        <path
          d={areaD}
          fill={color}
          fillOpacity={0.12}
          stroke="none"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={color}
      />
    </svg>
  )
}
