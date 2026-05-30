import Sparkline from './Sparkline'

interface MetricCardProps {
  label: string
  value: number | string
  /** Texto pequeno abaixo do valor (ex: "vs últimos 30d"). */
  footer?: string
  /** Variação percentual ou absoluta. Mostra delta colorido. */
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; tone?: 'positive' | 'negative' | 'neutral' }
  /** Sparkline de tendência. */
  trend?: number[]
  /** Destaca a card quando há atenção (cor accent). */
  attention?: boolean
  /** Tamanho do valor. */
  numSize?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: '20px',
  md: '28px',
  lg: '36px',
}

/**
 * Card de KPI usada em dashboards. Substitui número solto em caixa branca:
 * tem label, valor, delta opcional, sparkline opcional, attention state.
 *
 * Segue princípio "densidade inteligente" do PRODUCT_VISION:
 * mais informação útil sem poluir.
 */
export default function MetricCard({
  label,
  value,
  footer,
  delta,
  trend,
  attention = false,
  numSize = 'md',
}: MetricCardProps) {
  return (
    <div
      style={{
        background: attention ? 'var(--accent-bg)' : 'var(--bg-elev-1)',
        border: `1px solid ${attention ? 'var(--accent-border)' : 'var(--border-1)'}`,
        borderRadius: 'var(--r-md)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: attention ? 'var(--accent-text)' : 'var(--text-4)',
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
        {delta && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color:
                delta.tone === 'negative'
                  ? 'var(--danger-text)'
                  : delta.tone === 'positive'
                    ? 'var(--accent-text)'
                    : 'var(--text-3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              flexShrink: 0,
            }}
          >
            <span aria-hidden>
              {delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'}
            </span>
            {delta.value}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: sizes[numSize],
          fontWeight: 500,
          color: attention ? 'var(--accent-text)' : 'var(--text-1)',
          letterSpacing: '-0.025em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      {(footer || trend) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '2px',
            minHeight: '16px',
          }}
        >
          {footer && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-4)',
                lineHeight: 1.4,
                letterSpacing: '-0.005em',
                flex: 1,
              }}
            >
              {footer}
            </span>
          )}
          {trend && trend.length >= 2 && (
            <Sparkline
              values={trend}
              width={60}
              height={20}
              color={attention ? 'var(--accent-text)' : 'var(--text-3)'}
            />
          )}
        </div>
      )}
    </div>
  )
}
