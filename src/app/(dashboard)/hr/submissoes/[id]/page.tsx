import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import HRSubmissionActions from '@/components/submissions/HRSubmissionActions'
import AIAnalyzeButton from '@/components/submissions/AIAnalyzeButton'
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

  const { data: userData } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!['hr_manager', 'admin'].includes(userData?.role)) redirect('/login')

  const { data: sub } = await supabase
    .from('submissions')
    .select('*, candidates(full_name, current_title, location, email, phone, linkedin_url), jobs(id, title, seniority, location, work_model, companies(name)), recruiters(level, users(full_name, email))')
    .eq('id', id)
    .single()

  if (!sub) notFound()

  const candidate = sub.candidates as any
  const job = sub.jobs as any
  const recruiter = sub.recruiters as any

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
      {/* Voltar */}
      <Link
        href="/hr/submissoes"
        style={{
          fontSize: '13px',
          color: 'var(--color-muted)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '20px',
          transition: 'color .15s',
        }}
        className="hover:text-[#052E16]"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para a fila
      </Link>

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
        {sub.ai_score && (
          <div
            className="flex-shrink-0 text-center"
            style={{
              padding: '14px 22px',
              background: 'linear-gradient(135deg, var(--color-m100) 0%, #ffffff 100%)',
              border: '1px solid var(--color-border-g)',
              borderRadius: 'var(--radius-lg)',
              minWidth: '120px',
            }}
          >
            <div
              className="it"
              style={{
                fontSize: '38px',
                color: 'var(--color-g600)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {sub.ai_score}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--color-muted)',
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
            <HRSubmissionActions submissionId={sub.id} jobId={job?.id} />
          )}

          {sub.status === 'hr_approved' && (
            <HRSubmissionActions submissionId={sub.id} jobId={job?.id} mode="send" />
          )}

          {/* Análise da IA */}
          {sub.ai_summary && (
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
                  Análise da IA
                </div>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--color-text)',
                    lineHeight: 1.7,
                    fontWeight: 400,
                  }}
                >
                  {sub.ai_summary}
                </p>

                {sub.ai_risks && (sub.ai_risks as string[]).length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--color-subtle)',
                        marginTop: '20px',
                        marginBottom: '10px',
                      }}
                    >
                      Riscos identificados
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(sub.ai_risks as string[]).map((risk, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#FEF2F2',
                            color: '#991B1B',
                            fontSize: '11.5px',
                            padding: '5px 11px',
                            borderRadius: '8px',
                            border: '1px solid #FECACA',
                            fontWeight: 400,
                            lineHeight: 1.4,
                          }}
                        >
                          {risk}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {sub.ai_gaps && (sub.ai_gaps as string[]).length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--color-subtle)',
                        marginTop: '20px',
                        marginBottom: '10px',
                      }}
                    >
                      Gaps a validar
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(sub.ai_gaps as string[]).map((gap, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#FFFBEB',
                            color: '#92400E',
                            fontSize: '11.5px',
                            padding: '5px 11px',
                            borderRadius: '8px',
                            border: '1px solid #FDE68A',
                            fontWeight: 400,
                            lineHeight: 1.4,
                          }}
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
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
