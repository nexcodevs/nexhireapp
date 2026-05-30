interface BarChartItem {
  label: string
  value: number
  /** Cor da barra. Default = accent-text. */
  color?: string
}

interface BarChartProps {
  items: BarChartItem[]
  /** Valor máximo. Default = max dos items. */
  max?: number
  /** Largura total da área de barras (px). */
  width?: number
  /** Altura de cada linha (px). */
  rowHeight?: number
  /** Mostra valor à direita. Default true. */
  showValue?: boolean
  /** Sufixo do valor (ex: '%', ' envios'). */
  valueSuffix?: string
}

/**
 * Gráfico de barras horizontal compacto. Usado pra "top N" e distribuições.
 * Cada linha tem label, barra e valor. Inline SVG/divs, sem libs.
 */
export default function BarChart({
  items,
  max,
  width = 200,
  rowHeight = 26,
  showValue = true,
  valueSuffix = '',
}: BarChartProps) {
  if (items.length === 0) {
    return (
      <p
        style={{
          fontSize: '12px',
          color: 'var(--text-4)',
          padding: '18px',
          textAlign: 'center',
        }}
      >
        Sem dados.
      </p>
    )
  }

  const computedMax = max ?? Math.max(...items.map(i => i.value), 1)

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => {
        const pct = (item.value / computedMax) * 100
        const color = item.color ?? 'var(--accent-text)'
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: '8px',
              minHeight: `${rowHeight}px`,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-2)',
                  letterSpacing: '-0.005em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  width: '100%',
                  maxWidth: `${width}px`,
                  height: '4px',
                  background: 'var(--bg-elev-2)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct.toFixed(1)}%`,
                    height: '100%',
                    background: color,
                    borderRadius: '2px',
                    transition: 'width .2s var(--ease)',
                  }}
                />
              </div>
            </div>
            {showValue && (
              <span
                className="mono"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 500,
                  color: 'var(--text-2)',
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                }}
              >
                {item.value}
                {valueSuffix}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
