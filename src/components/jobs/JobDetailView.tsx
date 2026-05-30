import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface JobLanguage {
  code: string
  name: string
  level: string
}

export interface JobDetailData {
  id: string
  title: string
  description: string | null
  seniority: string | null
  location: string | null
  work_model: string | null
  employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  submission_deadline: string | null
  max_submissions_per_recruiter?: number | null
  required_skills?: unknown
  desired_skills?: unknown
  behavioral_competencies?: unknown
  culture_fit?: string | null
  languages?: unknown
  certifications?: unknown
  benefits?: unknown
  interview_questions?: unknown
  companies?: { name: string | null; logo_url?: string | null } | { name: string | null; logo_url?: string | null }[] | null
}

interface JobDetailViewProps {
  job: JobDetailData
  /** Se mostra perguntas de entrevista (admin/HR sim, hunter/empresa sim). */
  showInterviewQuestions?: boolean
  /** Mostra prazo + limite por hunter. */
  showRecruiterRules?: boolean
}

function asArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

function asLangArray(v: unknown): JobLanguage[] {
  if (!Array.isArray(v)) return []
  return v.filter(
    (x): x is JobLanguage =>
      typeof x === 'object' && x !== null && 'code' in x && 'name' in x && 'level' in x,
  )
}

function pickOne<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

/**
 * Visualização estruturada de uma vaga. Substitui textão único por blocos
 * organizados conforme PRODUCT_VISION: vaga é objeto, não descrição.
 */
export default function JobDetailView({
  job,
  showInterviewQuestions = false,
  showRecruiterRules = false,
}: JobDetailViewProps) {
  const company = pickOne(job.companies)
  const required = asArray(job.required_skills)
  const desired = asArray(job.desired_skills)
  const behavioral = asArray(job.behavioral_competencies)
  const languages = asLangArray(job.languages)
  const certifications = asArray(job.certifications)
  const benefits = asArray(job.benefits)
  const questions = asArray(job.interview_questions)

  const hasSalary = !!(job.salary_min || job.salary_max)
  const hasAnyStructured =
    required.length > 0 ||
    desired.length > 0 ||
    behavioral.length > 0 ||
    languages.length > 0 ||
    certifications.length > 0 ||
    benefits.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Hero: salário + metadados */}
      <Card padding="md">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}
        >
          {hasSalary && (
            <HeroItem
              label="Faixa salarial"
              value={
                job.salary_min && job.salary_max
                  ? `${formatCurrency(job.salary_min)} – ${formatCurrency(job.salary_max)}`
                  : job.salary_min
                    ? `A partir de ${formatCurrency(job.salary_min)}`
                    : job.salary_max
                      ? `Até ${formatCurrency(job.salary_max)}`
                      : '—'
              }
              tone="accent"
            />
          )}
          {job.seniority && <HeroItem label="Senioridade" value={job.seniority} />}
          {job.work_model && <HeroItem label="Modelo" value={job.work_model} />}
          {job.employment_type && <HeroItem label="Contrato" value={job.employment_type} />}
          {job.location && <HeroItem label="Localização" value={job.location} />}
          {showRecruiterRules && job.submission_deadline && (
            <HeroItem
              label="Prazo de envios"
              value={formatDate(job.submission_deadline)}
            />
          )}
          {showRecruiterRules && job.max_submissions_per_recruiter !== undefined && job.max_submissions_per_recruiter !== null && (
            <HeroItem
              label="Limite por hunter"
              value={`${job.max_submissions_per_recruiter} candidato${job.max_submissions_per_recruiter === 1 ? '' : 's'}`}
            />
          )}
        </div>
      </Card>

      {/* Descrição */}
      {job.description && (
        <Card padding="md">
          <SectionTitle>Sobre a vaga</SectionTitle>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-2)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}
          >
            {job.description}
          </p>
        </Card>
      )}

      {/* Perfil técnico */}
      {(required.length > 0 || desired.length > 0) && (
        <Card padding="md">
          <SectionTitle>Perfil técnico</SectionTitle>
          {required.length > 0 && (
            <div style={{ marginBottom: desired.length > 0 ? '14px' : 0 }}>
              <SubLabel>Obrigatórias</SubLabel>
              <div className="flex flex-wrap gap-1.5">
                {required.map((s, i) => (
                  <Badge key={i} variant="green" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {desired.length > 0 && (
            <div>
              <SubLabel>Desejáveis</SubLabel>
              <div className="flex flex-wrap gap-1.5">
                {desired.map((s, i) => (
                  <Badge key={i} variant="gray" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Perfil comportamental */}
      {(behavioral.length > 0 || job.culture_fit) && (
        <Card padding="md">
          <SectionTitle>Perfil comportamental</SectionTitle>
          {behavioral.length > 0 && (
            <div style={{ marginBottom: job.culture_fit ? '14px' : 0 }}>
              <SubLabel>Competências</SubLabel>
              <div className="flex flex-wrap gap-1.5">
                {behavioral.map((s, i) => (
                  <Badge key={i} variant="blue" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {job.culture_fit && (
            <div>
              <SubLabel>Fit cultural</SubLabel>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {job.culture_fit}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Idiomas + certificações lado a lado */}
      {(languages.length > 0 || certifications.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: languages.length > 0 && certifications.length > 0 ? '1fr 1fr' : '1fr',
            gap: '12px',
          }}
        >
          {languages.length > 0 && (
            <Card padding="md">
              <SectionTitle>Idiomas</SectionTitle>
              <div className="flex flex-col gap-1.5">
                {languages.map((l, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                    style={{ fontSize: '13px' }}
                  >
                    <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{l.name}</span>
                    <span
                      style={{
                        color: 'var(--text-3)',
                        textTransform: 'capitalize',
                        fontSize: '12px',
                      }}
                    >
                      {l.level}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {certifications.length > 0 && (
            <Card padding="md">
              <SectionTitle>Certificações</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {certifications.map((c, i) => (
                  <Badge key={i} variant="purple" size="sm">
                    {c}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Benefícios */}
      {benefits.length > 0 && (
        <Card padding="md">
          <SectionTitle>Benefícios</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {benefits.map((b, i) => (
              <Badge key={i} variant="green" size="sm">
                {b}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Perguntas pra entrevista (admin/HR vê; empresa cria) */}
      {showInterviewQuestions && questions.length > 0 && (
        <Card padding="md">
          <SectionTitle>Perguntas pré-aprovadas pra entrevista</SectionTitle>
          <ol
            style={{
              margin: 0,
              paddingLeft: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {questions.map((q, i) => (
              <li
                key={i}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-2)',
                  lineHeight: 1.55,
                }}
              >
                {q}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Empty state quando vaga é antiga sem campos estruturados */}
      {!hasAnyStructured && !job.description && (
        <Card padding="lg" className="text-center">
          <p style={{ fontSize: '12.5px', color: 'var(--text-4)' }}>
            Esta vaga não tem informações estruturadas. Empresa precisa atualizar.
          </p>
        </Card>
      )}

      {/* Company hint pro hunter */}
      {company?.name && (
        <p style={{ fontSize: '11.5px', color: 'var(--text-4)', textAlign: 'center', marginTop: '4px' }}>
          Vaga publicada por {company.name}
        </p>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-4)',
        marginBottom: '12px',
      }}
    >
      {children}
    </h3>
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

function HeroItem({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'accent' | 'neutral'
}) {
  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: tone === 'accent' ? 'var(--accent-text)' : 'var(--text-1)',
          letterSpacing: '-0.005em',
        }}
      >
        {value}
      </div>
    </div>
  )
}
