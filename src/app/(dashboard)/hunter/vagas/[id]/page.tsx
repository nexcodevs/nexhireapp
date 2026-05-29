import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import SubmitCandidateForm from '@/components/submissions/SubmitCandidateForm'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function HunterVagaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, companies(name)')
    .eq('id', id)
    .eq('status', 'open_for_hunters')
    .single()

  if (!job) notFound()

  type CompanyRel = { name: string | null }
  type CandidateRel = { full_name: string | null }
  function pickOne<T>(rel: T | T[] | null | undefined): T | null {
    if (!rel) return null
    return Array.isArray(rel) ? rel[0] ?? null : rel
  }
  const company = pickOne(job.companies as CompanyRel | CompanyRel[] | null | undefined)

  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('id, status, candidates(full_name)')
    .eq('job_id', id)
    .eq('recruiter_id', recruiter?.id || '')

  const submissionsCount = mySubmissions?.length || 0
  const limitReached = submissionsCount >= job.max_submissions_per_recruiter
  const deadlineExpired = job.submission_deadline
    ? new Date(job.submission_deadline) < new Date()
    : false
  const canSubmit = recruiter?.status === 'approved' && !limitReached && !deadlineExpired

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/hunter/vagas"
          className="text-sm text-muted hover:text-text flex items-center gap-1 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para vagas
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text mb-1">{job.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="font-medium">{company?.name}</span>
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
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card padding="md">
            <h2 className="text-base font-bold text-text mb-3">Descrição</h2>
            <p className="text-sm text-text2 leading-relaxed whitespace-pre-wrap">
              {job.description || 'Sem descrição.'}
            </p>
          </Card>

          {mySubmissions && mySubmissions.length > 0 && (
            <Card padding="md">
              <h2 className="text-base font-bold text-text mb-3">
                Meus candidatos ({submissionsCount}/{job.max_submissions_per_recruiter})
              </h2>
              <div className="flex flex-col gap-2">
                {mySubmissions.map(sub => {
                  const subCandidate = pickOne(sub.candidates as CandidateRel | CandidateRel[] | null | undefined)
                  return (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--bg-elev-2)', borderColor: 'var(--border-2)' }}>
                    <span className="text-sm font-medium text-text">
                      {subCandidate?.full_name}
                    </span>
                    <Badge variant={
                      sub.status === 'hr_approved' ? 'green' :
                      sub.status === 'hr_rejected' ? 'red' :
                      sub.status === 'hired' ? 'dark' : 'gray'
                    }>
                      {sub.status === 'submitted' && 'Enviado'}
                      {sub.status === 'hr_approved' && 'Aprovado'}
                      {sub.status === 'hr_rejected' && 'Reprovado'}
                      {sub.status === 'hired' && 'Contratado'}
                    </Badge>
                  </div>
                  )
                })}
              </div>
            </Card>
          )}

          {canSubmit && recruiter && (
            <SubmitCandidateForm
              jobId={job.id}
              recruiterId={recruiter.id}
              remainingSlots={job.max_submissions_per_recruiter - submissionsCount}
            />
          )}

          {!canSubmit && (
            <Card padding="md" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0" style={{ color: 'var(--warning-text)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  {recruiter?.status !== 'approved' && (
                    <p className="text-sm" style={{ color: 'var(--warning-text)' }}>Seu perfil ainda não foi aprovado.</p>
                  )}
                  {limitReached && (
                    <p className="text-sm" style={{ color: 'var(--warning-text)' }}>Você atingiu o limite de {job.max_submissions_per_recruiter} candidatos.</p>
                  )}
                  {deadlineExpired && (
                    <p className="text-sm" style={{ color: 'var(--warning-text)' }}>O prazo para envio expirou.</p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card padding="md">
            <h2 className="text-sm font-bold text-text mb-3">Detalhes</h2>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Contrato', value: job.employment_type || 'Não informado' },
                { label: 'Prazo', value: job.submission_deadline ? formatDate(job.submission_deadline) : 'Não definido' },
                { label: 'Limite por hunter', value: `${job.max_submissions_per_recruiter} candidatos` },
                { label: 'Seus envios', value: `${submissionsCount}/${job.max_submissions_per_recruiter}` },
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