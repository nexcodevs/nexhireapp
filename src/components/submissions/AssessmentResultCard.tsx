import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import AssessmentAnswersButton, {
  type AssessmentAnswer,
} from './AssessmentAnswersButton'

interface AssessmentData {
  technical_score: number | null
  behavioral_score: number | null
  cultural_fit_score: number | null
  overall_score: number | null
  ai_summary: string | null
  recommendation: string | null
  strengths?: string[] | null
  concerns?: string[] | null
  next_steps?: string | null
  answers?: AssessmentAnswer[] | null
  completed_at: string | null
}

interface AssessmentResultCardProps {
  assessment: AssessmentData
  candidateName?: string
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
export default function AssessmentResultCard({
  assessment,
  candidateName,
}: AssessmentResultCardProps) {
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

      {(assessment.strengths?.length || assessment.concerns?.length) ? (
        <div
          className="grid sm:grid-cols-2 gap-4"
          style={{ paddingTop: '12px', marginTop: '10px', borderTop: '1px solid var(--border-1)' }}
        >
          {assessment.strengths?.length ? (
            <PointsList label="Pontos fortes" items={assessment.strengths} tone="positive" />
          ) : null}
          {assessment.concerns?.length ? (
            <PointsList label="Pontos de atenção" items={assessment.concerns} tone="negative" />
          ) : null}
        </div>
      ) : null}

      {assessment.next_steps && (
        <div
          style={{
            paddingTop: '12px',
            marginTop: '10px',
            borderTop: '1px solid var(--border-1)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              marginBottom: '6px',
            }}
          >
            Próximos passos
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55 }}>
            {assessment.next_steps}
          </p>
        </div>
      )}

      <div
        className="flex items-center justify-between gap-3 flex-wrap"
        style={{ marginTop: '12px' }}
      >
        {assessment.completed_at ? (
          <p
            className="mono"
            style={{
              fontSize: '10px',
              color: 'var(--text-4)',
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
        ) : <span />}
        {assessment.answers && assessment.answers.length > 0 && (
          <AssessmentAnswersButton
            answers={assessment.answers}
            candidateName={candidateName}
          />
        )}
      </div>
    </Card>
  )
}

function PointsList({
  label,
  items,
  tone,
}: {
  label: string
  items: string[]
  tone: 'positive' | 'negative'
}) {
  const color = tone === 'positive' ? 'var(--accent-text)' : 'var(--danger-text)'
  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: '12.5px',
              color: 'var(--text-2)',
              lineHeight: 1.5,
              paddingLeft: '12px',
              position: 'relative',
            }}
          >
            <span aria-hidden style={{ position: 'absolute', left: 0, top: '7px', width: '4px', height: '4px', borderRadius: '50%', background: color }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
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
