import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface CandidateStructuredCardProps {
  yearsExperience: number | null
  skills: string[]
  languages: { code: string; name: string; level: string }[]
  certifications: string[]
  /** Skills da vaga pra destacar match (opcional). */
  jobRequiredSkills?: string[]
  jobDesiredSkills?: string[]
}

/**
 * Card com dados estruturados extraídos do CV do candidato.
 * Quando jobRequiredSkills/Desired vêm, destaca o match visualmente.
 */
export default function CandidateStructuredCard({
  yearsExperience,
  skills,
  languages,
  certifications,
  jobRequiredSkills = [],
  jobDesiredSkills = [],
}: CandidateStructuredCardProps) {
  const hasAny =
    skills.length > 0 ||
    languages.length > 0 ||
    certifications.length > 0 ||
    yearsExperience !== null

  if (!hasAny) return null

  // Normaliza skills da vaga pra comparação case-insensitive
  const requiredSet = new Set(jobRequiredSkills.map(s => s.trim().toLowerCase()))
  const desiredSet = new Set(jobDesiredSkills.map(s => s.trim().toLowerCase()))

  // Separa skills do candidato em 3 grupos: matches required, matches desired, outras
  const matchedRequired: string[] = []
  const matchedDesired: string[] = []
  const otherSkills: string[] = []
  for (const s of skills) {
    const l = s.trim().toLowerCase()
    if (requiredSet.has(l)) matchedRequired.push(s)
    else if (desiredSet.has(l)) matchedDesired.push(s)
    else otherSkills.push(s)
  }

  const hasMatchContext = jobRequiredSkills.length > 0 || jobDesiredSkills.length > 0
  const requiredCoveragePct =
    jobRequiredSkills.length > 0
      ? Math.round((matchedRequired.length / jobRequiredSkills.length) * 100)
      : null

  return (
    <Card padding="md">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          gap: '8px',
        }}
      >
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
          Perfil extraído do CV
        </h2>
        {requiredCoveragePct !== null && (
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color:
                requiredCoveragePct >= 75
                  ? 'var(--accent-text)'
                  : requiredCoveragePct >= 40
                    ? 'var(--warning-text)'
                    : 'var(--danger-text)',
              padding: '2px 8px',
              background:
                requiredCoveragePct >= 75
                  ? 'var(--accent-bg)'
                  : requiredCoveragePct >= 40
                    ? 'var(--warning-bg)'
                    : 'var(--danger-bg)',
              borderRadius: 'var(--r-sm)',
            }}
          >
            {requiredCoveragePct}% das skills obrigatórias
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {yearsExperience !== null && (
          <div className="flex items-baseline gap-2">
            <span
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: 'var(--text-1)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {yearsExperience}
            </span>
            <span style={{ fontSize: '12.5px', color: 'var(--text-3)' }}>
              ano{yearsExperience === 1 ? '' : 's'} de experiência
            </span>
          </div>
        )}

        {/* Skills com match destacado quando há contexto da vaga */}
        {(matchedRequired.length > 0 || matchedDesired.length > 0 || otherSkills.length > 0) && (
          <div>
            <SubLabel>Skills técnicas</SubLabel>
            <div className="flex flex-wrap gap-1.5">
              {matchedRequired.map((s, i) => (
                <Badge key={`req-${i}`} variant="green" size="sm">
                  ✓ {s}
                </Badge>
              ))}
              {matchedDesired.map((s, i) => (
                <Badge key={`des-${i}`} variant="blue" size="sm">
                  ✓ {s}
                </Badge>
              ))}
              {otherSkills.map((s, i) => (
                <Badge key={`o-${i}`} variant="gray" size="sm">
                  {s}
                </Badge>
              ))}
            </div>
            {hasMatchContext && (
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--text-4)',
                  marginTop: '8px',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: 'var(--accent-text)' }}>✓ verde</span> = obrigatório da vaga ·{' '}
                <span style={{ color: 'var(--accent-text)' }}>✓ azul</span> = desejável
              </p>
            )}
          </div>
        )}

        {languages.length > 0 && (
          <div>
            <SubLabel>Idiomas</SubLabel>
            <div className="flex flex-col gap-1">
              {languages.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between"
                  style={{ fontSize: '12.5px' }}
                >
                  <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{l.name}</span>
                  <span style={{ color: 'var(--text-3)', textTransform: 'capitalize', fontSize: '11.5px' }}>
                    {l.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {certifications.length > 0 && (
          <div>
            <SubLabel>Certificações</SubLabel>
            <div className="flex flex-wrap gap-1.5">
              {certifications.map((c, i) => (
                <Badge key={i} variant="purple" size="sm">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 500,
        color: 'var(--text-3)',
        marginBottom: '6px',
      }}
    >
      {children}
    </div>
  )
}
