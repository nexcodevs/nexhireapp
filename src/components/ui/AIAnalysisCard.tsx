import Badge from '@/components/ui/Badge'

interface AIAnalysisCardProps {
  candidateName?: string
  score: number
  summary?: string | null
  risks?: string[]
  gaps?: string[]
  strengths?: string[]
  processedAt?: string
  className?: string
}

function recommendation(score: number): { label: string; arrow: '↑' | '→' | '↓' } {
  if (score >= 75) return { label: 'Forte recomendação · Avançar', arrow: '↑' }
  if (score >= 50) return { label: 'Recomendação parcial · Avaliar', arrow: '→' }
  return { label: 'Risco · Considerar com cuidado', arrow: '↓' }
}

export default function AIAnalysisCard({
  candidateName,
  score,
  summary,
  risks,
  gaps,
  strengths,
  processedAt,
  className = '',
}: AIAnalysisCardProps) {
  const rec = recommendation(score)

  return (
    <div
      className={className}
      style={{
        padding: '28px',
        background: 'linear-gradient(135deg, var(--bg-elev-1) 0%, var(--bg-elev-2) 100%)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-xl)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decoração: radial neon glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0,230,118,.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '24px',
          position: 'relative',
        }}
      >
        <div
          aria-hidden
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--neon) 0%, var(--green-700) 100%)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 8px 20px rgba(0,230,118,.3), inset 0 1px 0 rgba(255,255,255,.3)',
            flexShrink: 0,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--green-950)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 8V4M12 8a4 4 0 0 0 0 8M12 8a4 4 0 0 1 0 8M12 16v4M4 12h4M16 12h4" />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-1)',
              letterSpacing: '-0.01em',
            }}
          >
            Análise de IA
          </div>
          {(candidateName || processedAt) && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-4)',
                marginTop: '2px',
              }}
            >
              {candidateName ? candidateName.toUpperCase() : ''}
              {candidateName && processedAt ? ' · ' : ''}
              {processedAt ?? ''}
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge variant="green" live size="md">
            FRESH
          </Badge>
        </div>
      </div>

      {/* Score block */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '20px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border-1)',
          marginBottom: '24px',
          position: 'relative',
        }}
      >
        <div
          style={{
                        fontSize: '96px',
            lineHeight: 0.9,
            color: 'var(--accent-text)',
            letterSpacing: '-0.04em',
          }}
        >
          {score}
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              marginBottom: '4px',
            }}
          >
            AI match score
          </div>
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: 'var(--text-1)',
              letterSpacing: '-0.005em',
            }}
          >
            <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
              {rec.arrow}
            </span>{' '}
            {rec.label}
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              marginBottom: '10px',
            }}
          >
            Resumo da IA
          </div>
          <p
            style={{
              fontSize: '13.5px',
              lineHeight: 1.65,
              color: 'var(--text-2)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {summary}
          </p>
        </div>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              marginBottom: '8px',
            }}
          >
            Pontos fortes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {strengths.map((s, i) => (
              <Badge key={i} variant="green">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      {gaps && gaps.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              marginBottom: '8px',
            }}
          >
            Lacunas
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {gaps.map((g, i) => (
              <Badge key={i} variant="yellow">
                {g}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {risks && risks.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              marginBottom: '8px',
            }}
          >
            Riscos identificados
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {risks.map((r, i) => (
              <Badge key={i} variant="red">
                {r}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
