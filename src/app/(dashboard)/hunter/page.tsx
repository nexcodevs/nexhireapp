import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'

export const metadata = {
  title: 'Dashboard Hunter — Nexhire',
}

export default async function HunterDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: recruiterData } = await supabase
    .from('recruiters')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, status, submitted_at, jobs(title)')
    .eq('recruiter_id', recruiterData?.id)
    .order('submitted_at', { ascending: false })
    .limit(5)

  const { data: availableJobs } = await supabase
    .from('jobs')
    .select('id, title, seniority, location, work_model, salary_min, salary_max')
    .eq('status', 'open_for_hunters')
    .limit(5)

  const stats = {
    enviados: submissions?.length || 0,
    aprovados: submissions?.filter(s => s.status === 'hr_approved').length || 0,
    contratados: submissions?.filter(s => s.status === 'hired').length || 0,
    disponiveis: availableJobs?.length || 0,
  }

  const levelLabels: Record<string, string> = {
    beginner: 'Iniciante',
    specialist: 'Especialista',
    top_hunter: 'Top Hunter',
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#052E16] mb-1">
            Olá, {userData?.full_name?.split(' ')[0] || 'Hunter'}
          </h1>
          <p className="text-[#6B7280] text-sm">
            Seu painel de oportunidades e submissões
          </p>
        </div>
        {recruiterData && (
          <span className={`
            text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider
            ${recruiterData.level === 'top_hunter'
              ? 'bg-[#052E16] text-[#00E676]'
              : recruiterData.level === 'specialist'
              ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
              : 'bg-[#F3F4F6] text-[#6B7280]'
            }
          `}>
            {levelLabels[recruiterData.level] || 'Iniciante'}
          </span>
        )}
      </div>

      {(!recruiterData || recruiterData.status === 'pending') && (
        <Card padding="md" className="mb-6 border-[#FEF3C7] bg-[#FFFBEB]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-[#92400E]">
                Perfil em análise
              </div>
              <div className="text-xs text-[#B45309] mt-0.5">
                Seu cadastro está sendo avaliado pelo time Nexhire. Você será notificado quando aprovado.
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Candidatos enviados', value: stats.enviados, color: 'text-[#052E16]' },
          { label: 'Aprovados pelo HR', value: stats.aprovados, color: 'text-[#16A34A]' },
          { label: 'Contratações', value: stats.contratados, color: 'text-[#00E676]' },
          { label: 'Vagas disponíveis', value: stats.disponiveis, color: 'text-[#3B82F6]' },
        ].map(stat => (
          <Card key={stat.label} padding="md">
            <div className={`text-3xl font-bold mb-1 ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-sm text-[#6B7280]">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Vagas disponíveis</h2>
            <Link href="/hunter/vagas" className="text-sm text-[#16A34A] hover:underline">
              Ver todas
            </Link>
          </div>
          {!availableJobs || availableJobs.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">
              Nenhuma vaga disponível no momento.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {availableJobs.map(job => (
                <Link
                  key={job.id}
                  href={`/hunter/vagas/${job.id}`}
                  className="flex items-start justify-between p-3 rounded-lg border border-[#E5E7EB] hover:border-[#BBF7D0] hover:bg-[#F0FDF4] transition-all"
                >
                  <div>
                    <div className="text-sm font-medium text-[#052E16]">{job.title}</div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5">
                      {job.location} · {job.work_model}
                    </div>
                  </div>
                  {job.salary_min && (
                    <span className="text-xs font-medium text-[#16A34A] flex-shrink-0 ml-2">
                      R$ {job.salary_min.toLocaleString('pt-BR')}+
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Minhas submissões</h2>
            <Link href="/hunter/submissoes" className="text-sm text-[#16A34A] hover:underline">
              Ver todas
            </Link>
          </div>
          {!submissions || submissions.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">
              Nenhuma submissão ainda.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {submissions.map(sub => (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div className="text-sm text-[#052E16] font-medium">
                    {(sub.jobs as any)?.title || 'Vaga'}
                  </div>
                  <span className={`
                    text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ml-2
                    ${sub.status === 'hr_approved' ? 'bg-[#F0FDF4] text-[#16A34A]' : ''}
                    ${sub.status === 'hr_rejected' ? 'bg-red-50 text-red-500' : ''}
                    ${sub.status === 'hired' ? 'bg-[#052E16] text-[#00E676]' : ''}
                    ${sub.status === 'submitted' ? 'bg-[#F3F4F6] text-[#6B7280]' : ''}
                  `}>
                    {sub.status === 'hr_approved' && 'Aprovado'}
                    {sub.status === 'hr_rejected' && 'Reprovado'}
                    {sub.status === 'hired' && 'Contratado'}
                    {sub.status === 'submitted' && 'Enviado'}
                    {!['hr_approved', 'hr_rejected', 'hired', 'submitted'].includes(sub.status) && sub.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}