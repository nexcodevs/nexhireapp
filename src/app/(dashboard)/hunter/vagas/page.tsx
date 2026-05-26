import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Vagas disponíveis — Nexhire',
}

export default async function HunterVagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, companies(name)')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })

  // Buscar submissões do hunter para saber quais vagas já enviou
  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('job_id')
    .eq('recruiter_id', recruiter?.id || '')

  const submittedJobIds = new Set(mySubmissions?.map(s => s.job_id) || [])

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#052E16] mb-1">
          Vagas disponíveis
        </h1>
        <p className="text-[#6B7280] text-sm">
          {jobs?.length || 0} vaga{jobs?.length !== 1 ? 's' : ''} abertas para hunters
        </p>
      </div>

      {/* Aviso se não aprovado */}
      {(!recruiter || recruiter.status !== 'approved') && (
        <Card padding="md" className="mb-6 border-[#FEF3C7] bg-[#FFFBEB]">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-[#92400E]">Perfil pendente de aprovação</div>
              <div className="text-xs text-[#B45309] mt-0.5">Você pode ver as vagas mas só poderá enviar candidatos após aprovação.</div>
            </div>
          </div>
        </Card>
      )}

      {!jobs || jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p className="text-[#9CA3AF] text-sm">Nenhuma vaga disponível no momento.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Volte em breve para novas oportunidades.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => {
            const alreadySubmitted = submittedJobIds.has(job.id)
            return (
              <Link key={job.id} href={`/hunter/vagas/${job.id}`} className="block">
                <Card padding="md" className="hover:border-[#BBF7D0] hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-base font-bold text-[#052E16] truncate">
                          {job.title}
                        </h2>
                        {alreadySubmitted && (
                          <Badge variant="green">Candidato enviado</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-2">
                        <span className="font-medium text-[#6B7280]">
                          {(job.companies as any)?.name}
                        </span>
                        {job.seniority && <span>· {job.seniority}</span>}
                        {job.location && <span>· {job.location}</span>}
                        {job.work_model && <span>· {job.work_model}</span>}
                        {job.employment_type && <span>· {job.employment_type}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        {job.submission_deadline && (
                          <span className="text-xs text-[#9CA3AF]">
                            Prazo: {formatDate(job.submission_deadline)}
                          </span>
                        )}
                        <span className="text-xs text-[#9CA3AF]">
                          Limite: {job.max_submissions_per_recruiter} candidatos
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {job.salary_min && (
                        <div className="text-sm font-medium text-[#16A34A]">
                          {formatCurrency(job.salary_min)}
                          {job.salary_max && ` — ${formatCurrency(job.salary_max)}`}
                        </div>
                      )}
                      <div className="text-xs text-[#9CA3AF] mt-0.5">
                        {formatDate(job.created_at)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}