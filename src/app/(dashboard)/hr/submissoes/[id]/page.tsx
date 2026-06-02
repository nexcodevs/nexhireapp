import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Breadcrumb from '@/components/ui/Breadcrumb'
import HRSubmissionActions from '@/components/submissions/HRSubmissionActions'
import AIAnalyzeButton from '@/components/submissions/AIAnalyzeButton'
import AIAnalysisCard from '@/components/ui/AIAnalysisCard'
import CandidateStructuredCard from '@/components/submissions/CandidateStructuredCard'
import AssessmentFlow from '@/components/submissions/AssessmentFlow'
import AssessmentResultCard from '@/components/submissions/AssessmentResultCard'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'

export default async function HRSubmissaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: userData } = await admin
    .from('users').select('role').eq('id', user.id).maybeSingle()
  if (!['hr_manager', 'admin'].includes(userData?.role)) redirect('/login')

  const { data: sub } = await admin
    .from('submissions')
    .select('*, candidates(full_name, current_title, location, email, phone, linkedin_url, cv_url, skills, language_proficiency, certifications, years_experience), jobs(id, title, seniority, location, work_model, required_skills, desired_skills, interview_questions, companies(name)), recruiters(level, users(full_name, email))')
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
  }
  type JobRel = {
    id: string
    title: string | null
    seniority: string | null
    location: string | null
    work_model: string | null
    required_skills: unknown
    desired_skills: unknown
    interview_questions: unknown
    companies: { name: string | null } | { name: string | null }[] | null
  }
  type RecruiterRel = {
    level: string | null
    users: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null
  }

  const candidatesRel = sub.candidates as CandidateRel | CandidateRel[] | null | undefined
  const jobsRel = sub.jobs as JobRel | JobRel[] | null | undefined
  const recruitersRel = sub.recruiters as RecruiterRel | RecruiterRel[] | null | undefined

  const candidate = Array.isArray(candidatesRel) ? candidatesRel[0] ?? null : candidatesRel ?? null
  const jobRaw = Array.isArray(jobsRel) ? jobsRel[0] ?? null : jobsRel ?? null
  const recruiterRaw = Array.isArray(recruitersRel) ? recruitersRel[0] ?? null : recruitersRel ?? null

  const jobCompanies = jobRaw?.companies
  const job = jobRaw
    ? {
        ...jobRaw,
        companies: Array.isArray(jobCompanies) ? jobCompanies[0] ?? null : jobCompanies ?? null,
      }
    : null

  const recruiterUsers = recruiterRaw?.users
  const recruiter = recruiterRaw
    ? {
        ...recruiterRaw,
        users: Array.isArray(recruiterUsers) ? recruiterUsers[0] ?? null : recruiterUsers ?? null,
      }
    : null

  let cvSignedUrl: string | null = null
  if (candidate?.cv_url) {
    const { data: signed } = await admin.storage
      .from('cvs')
      .createSignedUrl(candidate.cv_url, 60 * 5)
    cvSignedUrl = signed?.signedUrl ?? null
  }

  // Avaliação aplicada (se existir)
  interface AssessmentRow {
    id: string
    submission_id: string
    answers: unknown
    technical_score: number | null
    behavioral_score: number | null
    cultural_fit_score: number | null
    overall_score: number | null
    ai_summary: string | null
    recommendation: string | null
    strengths: string[] | null
    concerns: string[] | null
    next_steps: string | null
    status: string
    completed_at: string | null
  }
  const { data: assessment } = await admin
    .from('submission_assessments')
    .select('id, submission_id, answers, technical_score, behavioral_score, cultural_fit_score, overall_score, ai_summary, recommendation, strengths, concerns, next_steps, status, completed_at')
    .eq('submission_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<AssessmentRow>()

  const interviewQuestions = Array.isArray(job?.interview_questions)
    ? (job.interview_questions as string[]).filter(q => typeof q === 'string' && q.trim().length > 0)
    : []

  const statusInfo: Record<string, { label: string; variant: 'gray' | 'yellow' | 'green' | 'blue' | 'dark' | 'red' }> = {
    submitted: { label: 'Aguardando curadoria', variant: 'yellow' },
    ai_analyzed: { label: 'Analisado pela IA', variant: 'blue' },
    hr_approved: { label: 'Aprovado', variant: 'green' },
    hr_rejected: { label: 'Reprovado', variant: 'red' },
    sent_to_client: { label: 'Enviado ao cliente', variant: 'blue' },
    client_approved: { label: 'Cliente aprovou', variant: 'green' },
    client_rejected: { label: 'Cliente reprovou', variant: 'red' },
    interview_scheduled: { label: 'Entrevista', variant: 'blue' },
    hired: { label: 'Contratado', variant: 'dark' },
  }
  const status = statusInfo[sub.status] || { label: sub.status, variant: 'gray' as const }

  const hunterInitials =
    recruiter?.users?.full_name
      ?.split(' ')
      .map((n: string) => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '??'

  const recruiterLevelLabel: Record<string, string> = {
    beginner: 'Iniciante',
    specialist: 'Especialista',
    top_hunter: 'Top Hunter',
  }

  return (
    <div className="max-w-5xl">
      <Breadcrumb
        items={[
          { label: 'HR', href: '/hr' },
          { label: 'Submissões', href: '/hr/submissoes' },
          { label: candidate?.full_name ?? 'Candidato' },
        ]}
      />

      {/* Header — Nome + Score */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              color: 'var(--color-text)',
              marginBottom: '6px',
            }}
          >
            {candidate?.full_name}
          </h1>
          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--color-muted)',
              fontWeight: 300,
            }}
          >
            {candidate?.current_title}
            {candidate?.location && ` · ${candidate.location}`}
          </p>
        </div>
        {sub.ai_score && !sub.ai_summary && (
          <div
            className="shrink-0 text-center"
            style={{
              padding: '14px 22px',
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-lg)',
              minWidth: '120px',
            }}
          >
            <div
              className="it"
              style={{
                fontSize: '38px',
                color: 'var(--accent-text)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {sub.ai_score}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-4)',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              AI Score
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Coluna principal */}
        <div className="flex flex-col gap-5">
          {/* Analisar com IA (se ainda não analisou) */}
          {sub.status === 'submitted' && (
            <Card variant="mint" padding="md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '3px' }}>
                    Analisar com IA
                  </h2>
                  <p style={{ fontSize: '12.5px', color: 'var(--color-muted)' }}>
                    Gera score, resumo e pontos de atenção automaticamente.
                  </p>
                </div>
                <AIAnalyzeButton submissionId={sub.id} />
              </div>
            </Card>
          )}

          {/* Action Card escuro — decisão do HR */}
          {(sub.status === 'submitted' || sub.status === 'ai_analyzed') && (
            <HRSubmissionActions submissionId={sub.id} />
          )}

          {sub.status === 'hr_approved' && (
            <HRSubmissionActions submissionId={sub.id} mode="send" />
          )}

          {/* Análise da IA */}
          {sub.ai_summary && (
            <AIAnalysisCard
              candidateName={candidate?.full_name ?? undefined}
              score={Number(sub.ai_score ?? 0)}
              summary={sub.ai_summary}
              risks={(sub.ai_risks as string[] | null) ?? undefined}
              gaps={(sub.ai_gaps as string[] | null) ?? undefined}
            />
          )}

          {/* Avaliação aplicada (resultado) OU CTA pra aplicar */}
          {assessment && assessment.status === 'completed' ? (
            <div className="flex flex-col gap-2">
              <AssessmentResultCard
                candidateName={candidate?.full_name ?? undefined}
                assessment={{
                  technical_score: assessment.technical_score,
                  behavioral_score: assessment.behavioral_score,
                  cultural_fit_score: assessment.cultural_fit_score,
                  overall_score: assessment.overall_score,
                  ai_summary: assessment.ai_summary,
                  recommendation: assessment.recommendation,
                  strengths: assessment.strengths,
                  concerns: assessment.concerns,
                  next_steps: assessment.next_steps,
                  answers: Array.isArray(assessment.answers)
                    ? (assessment.answers as { question: string; answer: string; score?: number; notes?: string }[])
                    : undefined,
                  completed_at: assessment.completed_at,
                }}
              />
              {interviewQuestions.length > 0 && (
                <div className="flex justify-end">
                  <AssessmentFlow
                    submissionId={sub.id}
                    candidateName={candidate?.full_name ?? 'Candidato'}
                    questions={interviewQuestions}
                    existing={{
                      answers: Array.isArray(assessment.answers)
                        ? (assessment.answers as { question: string; answer: string; score?: number; notes?: string }[])
                        : [],
                      next_steps: assessment.next_steps,
                    }}
                  />
                </div>
              )}
            </div>
          ) : interviewQuestions.length > 0 ? (
            <Card variant="mint" padding="md">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '3px' }}>
                    Aplicar avaliação estruturada
                  </h2>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.5 }}>
                    {interviewQuestions.length} pergunta{interviewQuestions.length === 1 ? '' : 's'} pré-aprovada{interviewQuestions.length === 1 ? '' : 's'} pela empresa. IA gera score final.
                  </p>
                </div>
                <AssessmentFlow
                  submissionId={sub.id}
                  candidateName={candidate?.full_name ?? 'Candidato'}
                  questions={interviewQuestions}
                />
              </div>
            </Card>
          ) : null}

          {/* Perfil estruturado do candidato (skills, idiomas, certs) */}
          <CandidateStructuredCard
            yearsExperience={candidate?.years_experience ?? null}
            skills={Array.isArray(candidate?.skills) ? (candidate.skills as string[]).filter(s => typeof s === 'string') : []}
            languages={
              Array.isArray(candidate?.language_proficiency)
                ? (candidate.language_proficiency as { code: string; name: string; level: string }[]).filter(
                    l => l && typeof l === 'object' && 'name' in l && 'level' in l,
                  )
                : []
            }
            certifications={Array.isArray(candidate?.certifications) ? (candidate.certifications as string[]).filter(s => typeof s === 'string') : []}
            jobRequiredSkills={Array.isArray(job?.required_skills) ? (job.required_skills as string[]).filter(s => typeof s === 'string') : []}
            jobDesiredSkills={Array.isArray(job?.desired_skills) ? (job.desired_skills as string[]).filter(s => typeof s === 'string') : []}
          />

          {/* Avaliação do hunter */}
          {(sub.hunter_score || sub.jd_priorities || sub.hunter_score_rationale) && (
            <Card padding="none">
              <div style={{ padding: '22px 26px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--color-subtle)',
                    marginBottom: '12px',
                  }}
                >
                  Avaliação do hunter
                </div>
                {sub.hunter_score !== null && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                    <span
                      className="it"
                      style={{
                        fontSize: '28px',
                        color: 'var(--color-text)',
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {sub.hunter_score}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>/ 10 de fit</span>
                  </div>
                )}
                {sub.hunter_score_rationale && (
                  <p
                    style={{
                      fontSize: '13.5px',
                      color: 'var(--color-text)',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      marginBottom: sub.jd_priorities ? '16px' : 0,
                    }}
                  >
                    {sub.hunter_score_rationale}
                  </p>
                )}
                {sub.jd_priorities && (
                  <>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--color-subtle)',
                        marginBottom: '8px',
                      }}
                    >
                      Pontos do JD priorizados
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text2)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {sub.jd_priorities}
                    </p>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Resumo da entrevista */}
          <Card padding="none">
            <div style={{ padding: '22px 26px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-subtle)',
                  marginBottom: '12px',
                }}
              >
                Resumo da entrevista do hunter
              </div>
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'var(--color-text)',
                  lineHeight: 1.7,
                  fontWeight: 400,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {sub.interview_summary || (
                  <span style={{ color: 'var(--color-subtle)', fontStyle: 'italic', fontWeight: 300 }}>
                    O hunter não preencheu um resumo da entrevista.
                  </span>
                )}
              </p>
            </div>
          </Card>

          {/* Notas do hunter */}
          {sub.recruiter_notes && (
            <Card padding="none">
              <div style={{ padding: '22px 26px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--color-subtle)',
                    marginBottom: '12px',
                  }}
                >
                  Notas do hunter
                </div>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--color-text)',
                    lineHeight: 1.7,
                    fontWeight: 400,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {sub.recruiter_notes}
                </p>
              </div>
            </Card>
          )}

          {/* Feedback do cliente (se já reagiu) */}
          {sub.client_feedback && (
            <Card padding="none">
              <div style={{ padding: '22px 26px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--color-subtle)',
                    marginBottom: '12px',
                  }}
                >
                  Feedback do cliente
                </div>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--color-text)',
                    lineHeight: 1.7,
                    fontWeight: 400,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {sub.client_feedback}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Contato */}
          <Card padding="none">
            <div style={{ padding: '18px 20px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-subtle)',
                  marginBottom: '12px',
                }}
              >
                Contato
              </div>
              <div className="flex flex-col">
                {candidate?.email && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      padding: '7px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ color: 'var(--color-muted)' }}>Email</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500, fontSize: '12px' }} className="truncate ml-2">
                      {candidate.email}
                    </span>
                  </div>
                )}
                {candidate?.phone && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      padding: '7px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ color: 'var(--color-muted)' }}>Telefone</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{candidate.phone}</span>
                  </div>
                )}
                {candidate?.linkedin_url && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      padding: '7px 0',
                      borderBottom: cvSignedUrl ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--color-muted)' }}>LinkedIn</span>
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-g600)', fontWeight: 500, textDecoration: 'none' }}
                      className="hover:underline"
                    >
                      Ver perfil →
                    </a>
                  </div>
                )}
                {cvSignedUrl && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      padding: '7px 0',
                    }}
                  >
                    <span style={{ color: 'var(--color-muted)' }}>Currículo</span>
                    <a
                      href={cvSignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-g600)', fontWeight: 500, textDecoration: 'none' }}
                      className="hover:underline"
                    >
                      Ver CV →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Vaga */}
          <Card padding="none">
            <div style={{ padding: '18px 20px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-subtle)',
                  marginBottom: '12px',
                }}
              >
                Vaga
              </div>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  marginBottom: '3px',
                  letterSpacing: '-0.005em',
                }}
              >
                {job?.title}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-muted)', marginBottom: '10px' }}>
                {job?.companies?.name}
                {job?.seniority && ` · ${job.seniority}`}
              </div>
              <Link
                href={`/hr/vagas/${job?.id}`}
                style={{ fontSize: '12px', color: 'var(--color-g600)', fontWeight: 500, textDecoration: 'none' }}
                className="hover:underline"
              >
                Ver detalhes da vaga →
              </Link>
            </div>
          </Card>

          {/* Hunter */}
          <Card padding="none">
            <div style={{ padding: '18px 20px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-subtle)',
                  marginBottom: '12px',
                }}
              >
                Enviado por
              </div>
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'var(--color-f900)',
                    color: 'var(--color-neon)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {hunterInitials}
                </div>
                <div className="min-w-0">
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {recruiter?.users?.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-muted)',
                    }}
                    className="truncate"
                  >
                    {recruiter?.users?.email}
                  </div>
                </div>
              </div>
              {recruiter?.level && (
                <Badge variant={recruiter.level === 'top_hunter' ? 'dark' : recruiter.level === 'specialist' ? 'blue' : 'gray'}>
                  {recruiterLevelLabel[recruiter.level]}
                </Badge>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card padding="none">
            <div style={{ padding: '18px 20px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-subtle)',
                  marginBottom: '12px',
                }}
              >
                Timeline
              </div>
              <div className="flex flex-col">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12.5px',
                    padding: '7px 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span style={{ color: 'var(--color-muted)' }}>Enviado em</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                    {formatDate(sub.submitted_at)}
                  </span>
                </div>
                {sub.hr_reviewed_at && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      padding: '7px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ color: 'var(--color-muted)' }}>Revisado em</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                      {formatDate(sub.hr_reviewed_at)}
                    </span>
                  </div>
                )}
                {sub.sent_to_client_at && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      padding: '7px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ color: 'var(--color-muted)' }}>Enviado ao cliente</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                      {formatDate(sub.sent_to_client_at)}
                    </span>
                  </div>
                )}
                {sub.ownership_expires_at && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      padding: '7px 0',
                    }}
                  >
                    <span style={{ color: 'var(--color-muted)' }}>Ownership expira</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                      {formatDate(sub.ownership_expires_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
