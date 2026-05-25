import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'

export const metadata = {
  title: 'Dashboard HR — Nexhire',
}

export default async function HRDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!['hr_manager', 'admin'].includes(userData?.role)) {
    redirect('/login')
  }

  const [
    { count: totalJobs },
    { count: pendingJobs },
    { count: pendingSubmissions },
    { count: pendingHunters },
  ] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'pending_hr_review'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('recruiters').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentSubmissions } = await supabase
    .from('submissions')
    .select('id, status, submitted_at, jobs(title), candidates(full_name)')
    .order('submitted_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#052E16] mb-1">
          Operações — HR Manager
        </h1>
        <p className="text-[#6B7280] text-sm">
          Visão geral da plataforma
        </p>
      </div>

      {/* Alertas de ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Vagas para revisar',
            value: pendingJobs || 0,
            href: '/hr/vagas?status=pending_hr_review',
            urgent: (pendingJobs || 0) > 0,
          },
          {
            label: 'Submissões para curar',
            value: pendingSubmissions || 0,
            href: '/hr/submissoes?status=submitted',
            urgent: (pendingSubmissions || 0) > 0,
          },
          {
            label: 'Hunters para aprovar',
            value: pendingHunters || 0,
            href: '/hr/hunters?status=pending',
            urgent: (pendingHunters || 0) > 0,
          },
        ].map(item => (
          <Link key={item.label} href={item.href}>
            <Card
              padding="md"
              className={`cursor-pointer transition-all hover:shadow-md ${
                item.urgent
                  ? 'border-[#FEF3C7] bg-[#FFFBEB]'
                  : 'hover:border-[#BBF7D0]'
              }`}
            >
              <div className={`text-3xl font-bold mb-1 ${
                item.urgent ? 'text-[#D97706]' : 'text-[#052E16]'
              }`}>
                {item.value}
              </div>
              <div className="text-sm text-[#6B7280]">{item.label}</div>
              {item.urgent && item.value > 0 && (
                <div className="text-xs text-[#D97706] mt-1 font-medium">
                  Requer atenção
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats gerais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total de vagas', value: totalJobs || 0 },
          { label: 'Vagas abertas', value: 0 },
          { label: 'Total submissões', value: 0 },
          { label: 'Contratações', value: 0 },
        ].map(stat => (
          <Card key={stat.label} padding="md">
            <div className="text-3xl font-bold text-[#052E16] mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-[#6B7280]">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vagas recentes */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Vagas recentes</h2>
            <Link href="/hr/vagas" className="text-sm text-[#16A34A] hover:underline">
              Ver todas
            </Link>
          </div>
          {!recentJobs || recentJobs.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">
              Nenhuma vaga ainda.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {recentJobs.map(job => (
                <div key={job.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#052E16]">{job.title}</div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5">
                      {new Date(job.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span className={`
                    text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ml-2
                    ${job.status === 'pending_hr_review' ? 'bg-[#FFFBEB] text-[#D97706]' : ''}
                    ${job.status === 'open_for_hunters' ? 'bg-[#F0FDF4] text-[#16A34A]' : ''}
                    ${job.status === 'hired' ? 'bg-[#052E16] text-[#00E676]' : ''}
                    ${!['pending_hr_review', 'open_for_hunters', 'hired'].includes(job.status) ? 'bg-[#F3F4F6] text-[#6B7280]' : ''}
                  `}>
                    {job.status === 'pending_hr_review' && 'Para revisar'}
                    {job.status === 'open_for_hunters' && 'Aberta'}
                    {job.status === 'hired' && 'Contratado'}
                    {!['pending_hr_review', 'open_for_hunters', 'hired'].includes(job.status) && job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Submissões recentes */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Submissões recentes</h2>
            <Link href="/hr/submissoes" className="text-sm text-[#16A34A] hover:underline">
              Ver todas
            </Link>
          </div>
          {!recentSubmissions || recentSubmissions.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">
              Nenhuma submissão ainda.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {recentSubmissions.map(sub => (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#052E16]">
                      {(sub.candidates as any)?.full_name || 'Candidato'}
                    </div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5">
                      {(sub.jobs as any)?.title || 'Vaga'}
                    </div>
                  </div>
                  <span className={`
                    text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ml-2
                    ${sub.status === 'submitted' ? 'bg-[#F3F4F6] text-[#6B7280]' : ''}
                    ${sub.status === 'hr_approved' ? 'bg-[#F0FDF4] text-[#16A34A]' : ''}
                    ${sub.status === 'hr_rejected' ? 'bg-red-50 text-red-500' : ''}
                  `}>
                    {sub.status === 'submitted' && 'Aguardando'}
                    {sub.status === 'hr_approved' && 'Aprovado'}
                    {sub.status === 'hr_rejected' && 'Reprovado'}
                    {!['submitted', 'hr_approved', 'hr_rejected'].includes(sub.status) && sub.status}
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