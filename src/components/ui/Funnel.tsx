interface FunnelStage {
  label: string
  value: number
}

interface FunnelProps {
  /** Etapas em ordem (topo → fundo do funil). */
  stages: FunnelStage[]
  /** Mostra % de conversão da etapa anterior entre as barras. Default true. */
  showConversion?: boolean
}

/**
 * Funil de conversão em cascata. Cada etapa é uma barra horizontal cuja
 * largura é proporcional ao valor relativo à primeira etapa. Entre etapas,
 * mostra a taxa de conversão (% mantido em relação à etapa anterior) e
 * sinaliza o maior gargalo com cor de atenção.
 */
export default function Funnel({ stages, showConversion = true }: FunnelProps) {
  if (stages.length === 0 || stages[0].value === 0) {
    return (
      <p
        style={{
          fontSize: '12px',
          color: 'var(--text-4)',
          textAlign: 'center',
          padding: '18px 0',
        }}
      >
        Sem dados pra mostrar funil.
      </p>
    )
  }

  const top = stages[0].value

  // Identifica gargalo: etapa de transição com menor conversion rate
  let worstIdx = -1
  let worstRate = 1
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1].value
    if (prev === 0) continue
    const rate = stages[i].value / prev
    if (rate < worstRate) {
      worstRate = rate
      worstIdx = i
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {stages.map((stage, i) => {
        const pct = (stage.value / top) * 100
        const conversionFromPrev =
          i > 0 && stages[i - 1].value > 0
            ? (stage.value / stages[i - 1].value) * 100
            : null
        const isBottleneck = i === worstIdx && conversionFromPrev !== null && conversionFromPrev < 100

        return (
          <div key={i}>
            {/* Indicador de conversão (entre as barras) */}
            {showConversion && conversionFromPrev !== null && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  height: '14px',
                  marginBottom: '2px',
                }}
                aria-label={`${conversionFromPrev.toFixed(0)}% mantido em relação à etapa anterior`}
              >
                <span
                  aria-hidden
                  style={{
                    fontSize: '10px',
                    color: isBottleneck ? 'var(--danger-text)' : 'var(--text-4)',
                  }}
                >
                  ↓
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.04em',
                    color: isBottleneck ? 'var(--danger-text)' : 'var(--text-4)',
                    fontWeight: isBottleneck ? 600 : 400,
                  }}
                >
                  {conversionFromPrev.toFixed(0)}%
                </span>
              </div>
            )}

            {/* Barra do estágio */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-2)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {stage.label}
                </div>
                <div
                  style={{
                    height: '8px',
                    background: 'var(--bg-elev-2)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct.toFixed(1)}%`,
                      height: '100%',
                      background: 'var(--accent-text)',
                      borderRadius: '4px',
                      transition: 'width .2s var(--ease)',
                    }}
                  />
                </div>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-1)',
                  letterSpacing: '-0.02em',
                  flexShrink: 0,
                  minWidth: '28px',
                  textAlign: 'right',
                }}
              >
                {stage.value}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
