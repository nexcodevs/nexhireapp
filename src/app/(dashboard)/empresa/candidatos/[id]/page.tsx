import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Breadcrumb from '@/components/ui/Breadcrumb'
import CandidateOnePager from '@/components/submissions/CandidateOnePager'
import CandidateStructuredCard from '@/components/submissions/CandidateStructuredCard'
import AssessmentResultCard from '@/components/submissions/AssessmentResultCard'
import ClientCandidateActions from '@/components/submissions/ClientCandidateActions'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'

export default async function EmpresaCandidatoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('submissions')
    .select('*, candidates(full_name, current_title, location, email, phone, linkedin_url, cv_url, skills, language_proficiency, certifications, years_experience), jobs(id, title, seniority, location, work_model, required_skills, desired_skills, companies(name))')
    .eq('id', id)
    .maybeSingle()

  if (!sub) notFound()

  type CandidateRel = {
    full_name: string | null
    current_title: string | null
    location: string | null
    email: string | null
    phone: string | null
    linkedin_url: string | null
    cv_url: string | null
    skills: unknown
    language_proficiency: unknown
    certifications: unknown
    years_experience: number | null
  } | null

  type JobRel = {
    id: string
    title: string | null
    seniority: string | null
    location: string | null
    work_model: string | null
    required_skills: unknown
    desired_skills: unknown
    companies: { name: string | null } | null
  } | null

  const candidate = sub.candidates as CandidateRel
  const job = sub.jobs as JobRel

  // Signed URL pro CV (válida 10 min — tempo de leitura cômodo)
  let cvSignedUrl: string | null = null
  if (candidate?.cv_url) {
    const { data: signed } = await admin.storage
      .from('cvs')
      .createSignedUrl(candidate.cv_url, 60 * 10)
    cvSignedUrl = signed?.signedUrl ?? null
  }

  const hunterScore = typeof sub.hunter_score === 'number' ? sub.hunter_score : null
  const hasHunterAssessment =
    (typeof sub.jd_priorities === 'string' && sub.jd_priorities.trim().length > 0) ||
    hunterScore !== null ||
    (typeof sub.hunter_score_rationale === 'string' && sub.hunter_score_rationale.trim().length > 0)

  const aiSummary = typeof sub.ai_summary === 'string' ? sub.ai_summary : null
  const aiScore = typeof sub.ai_score === 'number' ? sub.ai_score : null
  const aiRisks = Array.isArray(sub.ai_risks) ? (sub.ai_risks as string[]) : []
  const aiGaps = Array.isArray(sub.ai_gaps) ? (sub.ai_gaps as string[]) : []
  const hasAIAnalysis = !!aiSummary || aiScore !== null

  // Avaliação aplicada pelo HR (status completed) — empresa pode ver
  interface AssessmentRow {
    technical_score: number | null
    behavioral_score: number | null
    cultural_fit_score: number | null
    overall_score: number | null
    ai_summary: string | null
    recommendation: string | null
    status: string
    completed_at: string | null
  }
  const { data: assessment } = await admin
    .from('submission_assessments')
    .select('technical_score, behavioral_score, cultural_fit_score, overall_score, ai_summary, recommendation, status, completed_at')
    .eq('submission_id', id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle<AssessmentRow>()

  return (
    <div className="max-w-5xl">
      <Breadcrumb
        items={[
          { label: 'Empresa', href: '/empresa' },
          { label: 'Candidatos', href: '/empresa/candidatos' },
          { label: candidate?.full_name ?? 'Candidato' },
        ]}
      />
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 500,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: 'var(--text-1)',
                }}
              >
                {candidate?.full_name}
              </h1>
              <Badge
                variant={
                  sub.status === 'sent_to_client'
                    ? 'yellow'
                    : sub.status === 'client_approved'
                      ? 'green'
                      : sub.status === 'client_rejected'
                        ? 'red'
                        : sub.status === 'interview_scheduled'
                          ? 'blue'
                          : sub.status === 'hired'
                            ? 'dark'
                            : 'gray'
                }
              >
                {sub.status === 'sent_to_client' && 'Para avaliar'}
                {sub.status === 'client_approved' && 'Aprovado'}
                {sub.status === 'client_rejected' && 'Reprovado'}
                {sub.status === 'interview_scheduled' && 'Entrevista agendada'}
                {sub.status === 'hired' && 'Contratado'}
              </Badge>
            </div>
            <div className="text-sm text-muted">
              {candidate?.current_title}
              {candidate?.location && ` · ${candidate.location}`}
              {job?.title && ` · candidato pra ${job.title}`}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="flex flex-col gap-4">
          {sub.status === 'sent_to_client' && (
            <ClientCandidateActions submissionId={sub.id} />
          )}
          {sub.status === 'client_approved' && (
            <ClientCandidateActions submissionId={sub.id} mode="schedule" />
          )}

          {assessment && (
            <AssessmentResultCard assessment={assessment} />
          )}

          <CandidateStructuredCard
            yearsExperience={candidate?.years_experience ?? null}
            skills={Array.isArray(candidate?.skills) ? (candidate.skills as string[]).filter(s => typeof s === 'string') : []}
            languages={
              Array.isArray(candidate?.language_proficiency)
                ? ((candidate.language_proficiency as { code: string; name: string; level: string }[]).filter(
                    l => l && typeof l === 'object' && 'name' in l && 'level' in l,
                  ))
                : []
            }
            certifications={Array.isArray(candidate?.certifications) ? (candidate.certifications as string[]).filter(s => typeof s === 'string') : []}
            jobRequiredSkills={Array.isArray(job?.required_skills) ? (job.required_skills as string[]).filter(s => typeof s === 'string') : []}
            jobDesiredSkills={Array.isArray(job?.desired_skills) ? (job.desired_skills as string[]).filter(s => typeof s === 'string') : []}
          />

          {hasHunterAssessment && (
            <Card padding="md">
              <h2
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-4)',
                  marginBottom: '14px',
                }}
              >
                Avaliação do hunter
              </h2>
              <div className="flex flex-col gap-4">
                {hunterScore !== null && (
                  <div className="flex items-baseline gap-3">
                    <div
                      style={{
                                                fontSize: '40px',
                        lineHeight: 0.9,
                        color: 'var(--text-1)',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {hunterScore}
                      <span
                        style={{ fontSize: '18px', color: 'var(--text-4)', marginLeft: '2px' }}
                      >
                        /10
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Score do hunter
                    </div>
                  </div>
                )}
                {sub.hunter_score_rationale && (
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-4)',
                        marginBottom: '4px',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Por que esse score
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-2)',
                        lineHeight: 1.55,
                      }}
                    >
                      {sub.hunter_score_rationale as string}
                    </p>
                  </div>
                )}
                {sub.jd_priorities && (
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-4)',
                        marginBottom: '4px',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Requisitos da vaga que o hunter validou
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-2)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {sub.jd_priorities as string}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {hasAIAnalysis && (
            <Card padding="md">
              <h2
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-4)',
                  marginBottom: '14px',
                }}
              >
                Análise da IA (curadoria interna)
              </h2>
              {aiScore !== null && (
                <div className="flex items-baseline gap-3 mb-3">
                  <div
                    style={{
                                            fontSize: '40px',
                      lineHeight: 0.9,
                      color: 'var(--text-1)',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {aiScore}
                    <span
                      style={{ fontSize: '18px', color: 'var(--text-4)', marginLeft: '2px' }}
                    >
                      /100
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Score geral
                  </div>
                </div>
              )}
              {aiSummary && (
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-2)',
                    lineHeight: 1.6,
                    marginBottom: aiGaps.length || aiRisks.length ? '12px' : 0,
                  }}
                >
                  {aiSummary}
                </p>
              )}
              {(aiGaps.length > 0 || aiRisks.length > 0) && (
                <div className="flex flex-col gap-2.5">
                  {aiGaps.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-4)',
                          marginBottom: '6px',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Gaps identificados
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiGaps.map((g, i) => (
                          <Badge key={i} variant="yellow" size="sm">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiRisks.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-4)',
                          marginBottom: '6px',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Riscos a considerar
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiRisks.map((r, i) => (
                          <Badge key={i} variant="red" size="sm">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          <CandidateOnePager
            submissionId={sub.id}
            candidateName={candidate?.full_name ?? 'Candidato'}
            candidateTitle={candidate?.current_title ?? null}
            jobTitle={job?.title ?? 'a vaga'}
            cachedPitch={(sub.ai_pitch as never) ?? null}
          />
        </div>

        <div className="flex flex-col gap-4">
          {(candidate?.email || candidate?.phone || candidate?.linkedin_url || cvSignedUrl) && (
            <Card padding="md">
              <h2
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-4)',
                  marginBottom: '12px',
                }}
              >
                Contato
              </h2>
              <div className="flex flex-col gap-2.5">
                {candidate?.email && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-subtle">Email</span>
                    <span className="text-sm text-text">{candidate.email}</span>
                  </div>
                )}
                {candidate?.phone && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-subtle">Telefone</span>
                    <span className="text-sm text-text">{candidate.phone}</span>
                  </div>
                )}
                {candidate?.linkedin_url && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-subtle">LinkedIn</span>
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                      style={{ color: 'var(--accent-text)' }}
                    >
                      Ver perfil
                    </a>
                  </div>
                )}
                {cvSignedUrl && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-subtle">Currículo</span>
                    <a
                      href={cvSignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline inline-flex items-center gap-1.5"
                      style={{ color: 'var(--accent-text)' }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                      Abrir PDF
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card padding="md">
            <h2
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-4)',
                marginBottom: '12px',
              }}
            >
              Vaga
            </h2>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-text">{job?.title}</div>
              <div className="text-xs text-subtle">{job?.companies?.name}</div>
              <Link
                href={`/empresa/vagas/${job?.id}/candidatos`}
                className="text-xs hover:underline"
                style={{ color: 'var(--accent-text)' }}
              >
                Ver outros candidatos da vaga →
              </Link>
            </div>
          </Card>

          <Card padding="md">
            <h2
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-4)',
                marginBottom: '12px',
              }}
            >
              Detalhes
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-subtle">Recebido em</span>
                <span className="text-sm text-text">{formatDate(sub.submitted_at)}</span>
              </div>
            </div>
          </Card>

          {sub.interview_summary && (
            <Card padding="md">
              <h2
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-4)',
                  marginBottom: '10px',
                }}
              >
                Notas do hunter
              </h2>
              <p
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-2)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {sub.interview_summary}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
