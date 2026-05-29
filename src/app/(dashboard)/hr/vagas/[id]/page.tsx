import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import HRJobActions from '@/components/jobs/HRJobActions'
import { getJobStatusLabel, getJobStatusVariant, formatDate, formatCurrency } from '@/lib/utils'

export default async function HRVagaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['hr_manager', 'admin'].includes(userData?.role)) {
    redirect('/login')
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('*, companies(name)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, candidates(full_name, current_title, location, email), recruiters(users(full_name))')
    .eq('job_id', id)
    .order('submitted_at', { ascending: false })

  type CompanyRel = { name: string | null }
  type CandidateRel = { full_name: string | null; current_title: string | null; location: string | null; email: string | null }
  type UserRel = { full_name: string | null }
  type RecruiterRel = { users: UserRel | UserRel[] | null }
  const pickOne = <T,>(rel: T | T[] | null | undefined): T | null =>
    Array.isArray(rel) ? rel[0] ?? null : rel ?? null

  const jobCompany = pickOne(job.companies as CompanyRel | CompanyRel[] | null | undefined)

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/hr/vagas"
          className="text-sm text-muted hover:text-text flex items-center gap-1 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para vagas
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text">{job.title}</h1>
              <Badge variant={getJobStatusVariant(job.status)}>
                {getJobStatusLabel(job.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="font-medium">{jobCompany?.name}</span>
              {job.seniority && <span>· {job.seniority}</span>}
              {job.location && <span>· {job.location}</span>}
              {job.work_model && <span>· {job.work_model}</span>}
            </div>
          </div>
          {job.salary_min && (
            <div className="text-right">
              <div className="text-lg font-bold text-g600">
                {formatCurrency(job.salary_min)}
                {job.salary_max && ` — ${formatCurrency(job.salary_max)}`}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conteúdo principal */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Ações HR */}
          {job.status === 'pending_hr_review' && (
            <HRJobActions jobId={job.id} />
          )}

          {/* Descrição */}
          <Card padding="md">
            <h2 className="text-base font-bold text-text mb-3">Descrição</h2>
            <p className="text-sm text-text2 leading-relaxed whitespace-pre-wrap">
              {job.description || 'Sem descrição.'}
            </p>
          </Card>

          {/* Submissões */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-base font-bold text-text">
                Submissões ({submissions?.length || 0})
              </h2>
              {submissions && submissions.length > 0 && (
                <Link
                  href={`/hr/vagas/${job.id}/shortlist`}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--accent-text)',
                    background: 'var(--accent-bg)',
                    border: '1px solid var(--accent-border)',
                    padding: '6px 10px',
                    borderRadius: 'var(--r-md)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                  </svg>
                  Ver shortlist IA →
                </Link>
              )}
            </div>
            {!submissions || submissions.length === 0 ? (
              <p className="text-sm text-subtle text-center py-4">
                Nenhuma submissão ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {submissions.map(sub => {
                  const candidate = pickOne(sub.candidates as CandidateRel | CandidateRel[] | null | undefined)
                  const recruiterRaw = pickOne(sub.recruiters as RecruiterRel | RecruiterRel[] | null | undefined)
                  const recruiterUser = recruiterRaw ? pickOne(recruiterRaw.users) : null
                  return (
                  <div
                    key={sub.id}
                    className="flex items-start justify-between p-3 rounded-lg border transition-colors hover:border-(--accent-border)"
                    style={{ borderColor: 'var(--border-2)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-sm font-medium text-text">
                          {candidate?.full_name}
                        </div>
                        {sub.ai_score && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--accent-text)', background: 'var(--accent-bg)' }}>
                            Score {sub.ai_score}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-subtle">
                        {candidate?.current_title}
                        {candidate?.location && ` · ${candidate.location}`}
                      </div>
                      <div className="text-xs text-subtle mt-0.5">
                        Hunter: {recruiterUser?.full_name || 'Desconhecido'}
                      </div>
                    </div>
                    <Badge variant={
                      sub.status === 'hr_approved' ? 'green' :
                      sub.status === 'hr_rejected' ? 'red' :
                      sub.status === 'hired' ? 'dark' :
                      sub.status === 'submitted' ? 'yellow' : 'gray'
                    }>
                      {sub.status === 'submitted' && 'Aguardando'}
                      {sub.status === 'ai_analyzed' && 'Analisado'}
                      {sub.status === 'hr_approved' && 'Aprovado'}
                      {sub.status === 'hr_rejected' && 'Reprovado'}
                      {sub.status === 'sent_to_client' && 'Enviado'}
                      {sub.status === 'hired' && 'Contratado'}
                    </Badge>
                  </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card padding="md">
            <h2 className="text-sm font-bold text-text mb-3">Detalhes</h2>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Empresa', value: jobCompany?.name },
                { label: 'Criada em', value: formatDate(job.created_at) },
                { label: 'Prazo', value: job.submission_deadline ? formatDate(job.submission_deadline) : 'Não definido' },
                { label: 'Limite por hunter', value: `${job.max_submissions_per_recruiter} candidatos` },
                { label: 'Contrato', value: job.employment_type || 'Não definido' },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-subtle">{item.label}</span>
                  <span className="text-sm font-medium text-text">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}