import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { getJobStatusLabel, getJobStatusVariant, formatDate, formatCurrency } from '@/lib/utils'

export default async function EmpresaVagaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, candidates(full_name, current_title, location)')
    .eq('job_id', id)
    .in('status', ['sent_to_client', 'client_approved', 'client_rejected', 'interview_scheduled', 'offer', 'hired'])
    .order('submitted_at', { ascending: false })

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/empresa/vagas"
          className="text-sm text-[#6B7280] hover:text-[#052E16] flex items-center gap-1 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para vagas
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#052E16]">{job.title}</h1>
              <Badge variant={getJobStatusVariant(job.status)}>
                {getJobStatusLabel(job.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              {job.seniority && <span>{job.seniority}</span>}
              {job.location && <span>· {job.location}</span>}
              {job.work_model && <span>· {job.work_model}</span>}
              {job.employment_type && <span>· {job.employment_type}</span>}
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

      {/* Status banner */}
      {job.status === 'pending_hr_review' && (
        <Card padding="md" className="mb-6 border-[#FEF3C7] bg-[#FFFBEB]">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#D97706] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-[#92400E]">Vaga em revisão</div>
              <div className="text-xs text-[#B45309]">O HR Manager está revisando sua vaga. Você será notificado quando for aprovada.</div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Descrição */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card padding="md">
            <h2 className="text-base font-bold text-[#052E16] mb-3">Descrição</h2>
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </Card>

          {/* Candidatos aprovados */}
          {submissions && submissions.length > 0 && (
            <Card padding="md">
              <h2 className="text-base font-bold text-[#052E16] mb-4">
                Candidatos recebidos
              </h2>
              <div className="flex flex-col gap-3">
                {submissions.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB]"
                  >
                    <div>
                      <div className="text-sm font-medium text-[#052E16]">
                        {(sub.candidates as any)?.full_name}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">
                        {(sub.candidates as any)?.current_title}
                        {(sub.candidates as any)?.location && ` · ${(sub.candidates as any)?.location}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.ai_score && (
                        <span className="text-xs font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-1 rounded-full">
                          {sub.ai_score}
                        </span>
                      )}
                      <Badge variant={
                        sub.status === 'client_approved' ? 'green' :
                        sub.status === 'client_rejected' ? 'red' :
                        sub.status === 'hired' ? 'dark' : 'gray'
                      }>
                        {sub.status === 'sent_to_client' && 'Para avaliar'}
                        {sub.status === 'client_approved' && 'Aprovado'}
                        {sub.status === 'client_rejected' && 'Reprovado'}
                        {sub.status === 'interview_scheduled' && 'Entrevista'}
                        {sub.status === 'offer' && 'Proposta'}
                        {sub.status === 'hired' && 'Contratado'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card padding="md">
            <h2 className="text-sm font-bold text-[#052E16] mb-3">Detalhes</h2>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Criada em', value: formatDate(job.created_at) },
                { label: 'Prazo', value: job.submission_deadline ? formatDate(job.submission_deadline) : 'Não definido' },
                { label: 'Limite por hunter', value: `${job.max_submissions_per_recruiter} candidatos` },
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