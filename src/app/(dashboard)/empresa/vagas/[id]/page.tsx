import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import SubmitCandidateForm from '@/components/submissions/SubmitCandidateForm'
import { formatDate, formatCurrency } from '@/lib/utils'
import { visibleTypesForLevel, type RecruiterLevel } from '@/lib/visibility'

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

  // Checagem de visibilidade — protege acesso direto via URL
  const hunterLevel: RecruiterLevel | null =
    recruiter?.status === 'approved' ? ((recruiter?.level as RecruiterLevel) || 'beginner') : null
  const allowedTypes = visibleTypesForLevel(hunterLevel)
  const jobVisibility = job.visibility_type || 'open'

  // Bloqueia se hunter aprovado tenta acessar vaga acima do seu nível
  if (hunterLevel && !allowedTypes.includes(jobVisibility)) {
    notFound()
  }

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

  const isExclusive = jobVisibility !== 'open'

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/hunter/vagas"
          className="text-sm text-[#6B7280] hover:text-[#052E16] flex items-center gap-1 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para vagas
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-[#052E16]">{job.title}</h1>
              {isExclusive && jobVisibility === 'top_hunters_only' && (
                <Badge variant="dark">Exclusiva Top Hunters</Badge>
              )}
              {isExclusive && jobVisibility === 'specialist_plus' && (
                <Badge variant="blue">Especialistas+</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <span className="font-medium">{(job.companies as any)?.name}</span>
              {job.seniority && <span>· {job.seniority}</span>}
              {job.location && <span>· {job.location}</span>}
              {job.work_model && <span>· {job.work_model}</span>}
            </div>
          </div>
          {job.salary_min && (
            <div className="text-right">
              <div className="text-lg font-bold text-[#16A34A]">
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
            <h2 className="text-base font-bold text-[#052E16] mb-3">Descrição</h2>
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
              {job.description || 'Sem descrição.'}
            </p>
          </Card>

          {mySubmissions && mySubmissions.length > 0 && (
            <Card padding="md">
              <h2 className="text-base font-bold text-[#052E16] mb-3">
                Meus candidatos ({submissionsCount}/{job.max_submissions_per_recruiter})
              </h2>
              <div className="flex flex-col gap-2">
                {mySubmissions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                    <span className="text-sm font-medium text-[#052E16]">
                      {(sub.candidates as any)?.full_name}
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
                ))}
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
            <Card padding="md" className="border-[#FEF3C7] bg-[#FFFBEB]">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#D97706] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  {recruiter?.status !== 'approved' && (
                    <p className="text-sm text-[#92400E]">Seu perfil ainda não foi aprovado.</p>
                  )}
                  {limitReached && (
                    <p className="text-sm text-[#92400E]">Você atingiu o limite de {job.max_submissions_per_recruiter} candidatos.</p>
                  )}
                  {deadlineExpired && (
                    <p className="text-sm text-[#92400E]">O prazo para envio expirou.</p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card padding="md">
            <h2 className="text-sm font-bold text-[#052E16] mb-3">Detalhes</h2>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Contrato', value: job.employment_type || 'Não informado' },
                { label: 'Prazo', value: job.submission_deadline ? formatDate(job.submission_deadline) : 'Não definido' },
                { label: 'Limite por hunter', value: `${job.max_submissions_per_recruiter} candidatos` },
                { label: 'Seus envios', value: `${submissionsCount}/${job.max_submissions_per_recruiter}` },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#9CA3AF]">{item.label}</span>
                  <span className="text-sm font-medium text-[#052E16]">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}