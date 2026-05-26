import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Dashboard Hunter — Nexhire',
}

export default async function HunterDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('full_name').eq('id', user.id).single()

  const { data: recruiter } = await supabase
    .from('recruiters').select('*').eq('user_id', user.id).single()

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, status, submitted_at, ai_score, candidates(full_name), jobs(title, companies(name))')
    .eq('recruiter_id', recruiter?.id || '')
    .order('submitted_at', { ascending: false })

  const { data: openJobs } = await supabase
    .from('jobs')
    .select('id, title, location, work_model, salary_min, salary_max, companies(name)')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })
    .limit(3)

  const stats = {
    enviados: submissions?.length || 0,
    aprovados_hr: submissions?.filter(s => ['hr_approved', 'sent_to_client', 'client_approved', 'interview_scheduled', 'hired'].includes(s.status)).length || 0,
    contratacoes: submissions?.filter(s => s.status === 'hired').length || 0,
    vagas_disponiveis: openJobs?.length || 0,
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#052E16] mb-1">
          Olá, {userData?.full_name?.split(' ')[0] || 'hunter'}
        </h1>
        <p className="text-[#6B7280] text-sm">Seu painel de oportunidades e submissões</p>
      </div>

      {/* Aviso perfil pendente */}
      {(!recruiter || recruiter.status !== 'approved') && (
        <Card padding="md" className="mb-6 border-[#FEF3C7] bg-[#FFFBEB]">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#D97706] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-[#92400E]">Perfil em análise</div>
              <div className="text-xs text-[#B45309]">Seu cadastro está sendo avaliado pelo time Nexhire. Você será notificado quando aprovado.</div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Candidatos enviados', value: stats.enviados, color: 'text-[#052E16]' },
          { label: 'Aprovados pelo HR', value: stats.aprovados_hr, color: 'text-[#16A34A]' },
          { label: 'Contratações', value: stats.contratacoes, color: 'text-[#16A34A]' },
          { label: 'Vagas disponíveis', value: stats.vagas_disponiveis, color: 'text-[#3B82F6]' },
        ].map(stat => (
          <Card key={stat.label} padding="md">
            <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-[#6B7280]">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vagas disponíveis */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Vagas disponíveis</h2>
            <Link href="/hunter/vagas" className="text-sm text-[#16A34A] hover:underline">Ver todas</Link>
          </div>
          {!openJobs || openJobs.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">Nenhuma vaga disponível no momento.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {openJobs.map(job => (
                <Link key={job.id} href={`/hunter/vagas/${job.id}`} className="py-3 flex items-center justify-between hover:bg-[#F9FAFB] -mx-2 px-2 rounded transition-colors">
                  <div>
                    <div className="text-sm font-medium text-[#052E16]">{job.title}</div>
                    <div className="text-xs text-[#9CA3AF]">
                      {(job.companies as any)?.name}
                      {job.location && ` · ${job.location}`}
                    </div>
                  </div>
                  {job.salary_min && (
                    <div className="text-xs font-medium text-[#16A34A]">
                      {formatCurrency(job.salary_min)}+
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Minhas submissões */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Minhas submissões</h2>
            <Link href="/hunter/submissoes" className="text-sm text-[#16A34A] hover:underline">Ver todas</Link>
          </div>
          {!submissions || submissions.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">Nenhuma submissão ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {submissions.slice(0, 5).map(sub => (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#052E16]">
                      {(sub.candidates as any)?.full_name}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">{(sub.jobs as any)?.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.ai_score && (
                      <span className="text-xs font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
                        {sub.ai_score}
                      </span>
                    )}
                    <Badge variant={
                      sub.status === 'submitted' ? 'gray' :
                      sub.status === 'hr_approved' ? 'green' :
                      sub.status === 'hr_rejected' ? 'red' :
                      sub.status === 'hired' ? 'dark' : 'gray'
                    }>
                      {sub.status === 'submitted' && 'Enviado'}
                      {sub.status === 'ai_analyzed' && 'Analisado'}
                      {sub.status === 'hr_approved' && 'Aprovado'}
                      {sub.status === 'hr_rejected' && 'Reprovado'}
                      {sub.status === 'sent_to_client' && 'Com cliente'}
                      {sub.status === 'hired' && 'Contratado'}
                      {!['submitted','ai_analyzed','hr_approved','hr_rejected','sent_to_client','hired'].includes(sub.status) && sub.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}