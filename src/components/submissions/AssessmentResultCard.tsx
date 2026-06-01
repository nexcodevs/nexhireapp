import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface AssessmentData {
  technical_score: number | null
  behavioral_score: number | null
  cultural_fit_score: number | null
  overall_score: number | null
  ai_summary: string | null
  recommendation: string | null
  completed_at: string | null
}

interface AssessmentResultCardProps {
  assessment: AssessmentData
}

function scoreColor(score: number): string {
  if (score >= 75) return 'var(--accent-text)'
  if (score >= 50) return 'var(--text-2)'
  return 'var(--danger-text)'
}

const recommendationLabel: Record<string, { label: string; variant: 'green' | 'yellow' | 'red' }> = {
  avancar: { label: 'Avançar', variant: 'green' },
  revisar: { label: 'Revisar', variant: 'yellow' },
  rejeitar: { label: 'Rejeitar', variant: 'red' },
}

/**
 * Mostra o resultado de uma avaliação aplicada — scores por dimensão,
 * recomendação IA e sumário executivo.
 */
export default function AssessmentResultCard({ assessment }: AssessmentResultCardProps) {
  const rec = assessment.recommendation
    ? recommendationLabel[assessment.recommendation] ?? null
    : null

  const overall = assessment.overall_score ?? 0
  const technical = assessment.technical_score ?? 0
  const behavioral = assessment.behavioral_score ?? 0
  const cultural = assessment.cultural_fit_score ?? 0

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
          }}
        >
          Avaliação aplicada
        </h2>
        {rec && (
          <Badge variant={rec.variant} size="sm">
            IA recomenda: {rec.label}
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-3 mb-3 flex-wrap">
        <div
          style={{
            fontSize: '36px',
            fontWeight: 500,
            color: scoreColor(overall),
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {overall}
          <span style={{ fontSize: '14px', color: 'var(--text-4)', marginLeft: '4px' }}>
            /100
          </span>
        </div>
        <span
          className="mono"
          style={{ fontSize: '10.5px', color: 'var(--text-4)', letterSpacing: '0.04em' }}
        >
          score geral
        </span>
      </div>

      <div
        className="grid grid-cols-3 gap-3 mb-3"
        style={{ paddingTop: '12px', borderTop: '1px solid var(--border-1)' }}
      >
        <ScoreBlock label="Técnico" value={technical} />
        <ScoreBlock label="Comportamental" value={behavioral} />
        <ScoreBlock label="Fit cultural" value={cultural} />
      </div>

      {assessment.ai_summary && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-2)',
            lineHeight: 1.6,
            paddingTop: '10px',
            borderTop: '1px solid var(--border-1)',
          }}
        >
          {assessment.ai_summary}
        </p>
      )}

      {assessment.completed_at && (
        <p
          className="mono"
          style={{
            fontSize: '10px',
            color: 'var(--text-4)',
            marginTop: '10px',
            letterSpacing: '0.04em',
          }}
        >
          Avaliado em{' '}
          {new Date(assessment.completed_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </p>
      )}
    </Card>
  )
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 500,
          color: scoreColor(value),
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
        <span style={{ fontSize: '11px', color: 'var(--text-4)', marginLeft: '2px' }}>
          /100
        </span>
      </div>
    </div>
  )
}
