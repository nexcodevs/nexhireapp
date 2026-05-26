import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { getJobStatusLabel, getJobStatusVariant, formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Dashboard HR — Nexhire',
}

export default async function HRDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!['hr_manager', 'admin'].includes(userData?.role)) redirect('/login')

  const [
    { count: totalJobs },
    { count: pendingJobs },
    { count: openJobs },
    { count: totalSubmissions },
    { count: pendingSubmissions },
    { count: approvedSubmissions },
    { count: hiredSubmissions },
    { count: pendingHunters },
  ] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'pending_hr_review'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open_for_hunters'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'hr_approved'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'hired'),
    supabase.from('recruiters').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('id, title, status, created_at, companies(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentSubmissions } = await supabase
    .from('submissions')
    .select('id, status, submitted_at, ai_score, candidates(full_name), jobs(title)')
    .order('submitted_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#052E16] mb-1">Operações — HR Manager</h1>
        <p className="text-[#6B7280] text-sm">Visão geral da plataforma</p>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Vagas para revisar', value: pendingJobs || 0, href: '/hr/vagas', urgent: (pendingJobs || 0) > 0 },
          { label: 'Submissões para curar', value: pendingSubmissions || 0, href: '/hr/submissoes', urgent: (pendingSubmissions || 0) > 0 },
          { label: 'Hunters para aprovar', value: pendingHunters || 0, href: '/hr/hunters', urgent: (pendingHunters || 0) > 0 },
        ].map(item => (
          <Link key={item.label} href={item.href}>
            <Card padding="md" className={`cursor-pointer transition-all hover:shadow-md ${item.urgent ? 'border-[#FEF3C7] bg-[#FFFBEB]' : 'hover:border-[#BBF7D0]'}`}>
              <div className={`text-3xl font-bold mb-1 ${item.urgent ? 'text-[#D97706]' : 'text-[#052E16]'}`}>
                {item.value}
              </div>
              <div className="text-sm text-[#6B7280]">{item.label}</div>
              {item.urgent && item.value > 0 && (
                <div className="text-xs text-[#D97706] mt-1 font-medium">Requer atenção</div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total vagas', value: totalJobs || 0 },
          { label: 'Vagas abertas', value: openJobs || 0 },
          { label: 'Total submissões', value: totalSubmissions || 0 },
          { label: 'Aprovados HR', value: approvedSubmissions || 0 },
          { label: 'Contratações', value: hiredSubmissions || 0 },
        ].map(stat => (
          <Card key={stat.label} padding="md">
            <div className="text-2xl font-bold text-[#052E16] mb-1">{stat.value}</div>
            <div className="text-xs text-[#6B7280]">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vagas recentes */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Vagas recentes</h2>
            <Link href="/hr/vagas" className="text-sm text-[#16A34A] hover:underline">Ver todas</Link>
          </div>
          {!recentJobs || recentJobs.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">Nenhuma vaga ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {recentJobs.map(job => (
                <Link key={job.id} href={`/hr/vagas/${job.id}`} className="py-3 flex items-center justify-between hover:bg-[#F9FAFB] -mx-2 px-2 rounded transition-colors">
                  <div>
                    <div className="text-sm font-medium text-[#052E16]">{job.title}</div>
                    <div className="text-xs text-[#9CA3AF]">{(job.companies as any)?.name} · {formatDate(job.created_at)}</div>
                  </div>
                  <Badge variant={getJobStatusVariant(job.status)}>
                    {getJobStatusLabel(job.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Submissões recentes */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Submissões recentes</h2>
            <Link href="/hr/submissoes" className="text-sm text-[#16A34A] hover:underline">Ver todas</Link>
          </div>
          {!recentSubmissions || recentSubmissions.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">Nenhuma submissão ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {recentSubmissions.map(sub => (
                <Link key={sub.id} href={`/hr/submissoes/${sub.id}`} className="py-3 flex items-center justify-between hover:bg-[#F9FAFB] -mx-2 px-2 rounded transition-colors">
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
                      sub.status === 'submitted' ? 'yellow' :
                      sub.status === 'hr_approved' ? 'green' :
                      sub.status === 'hr_rejected' ? 'red' :
                      sub.status === 'hired' ? 'dark' : 'gray'
                    }>
                      {sub.status === 'submitted' && 'Aguardando'}
                      {sub.status === 'ai_analyzed' && 'Analisado'}
                      {sub.status === 'hr_approved' && 'Aprovado'}
                      {sub.status === 'hr_rejected' && 'Reprovado'}
                      {sub.status === 'hired' && 'Contratado'}
                      {!['submitted','ai_analyzed','hr_approved','hr_rejected','hired'].includes(sub.status) && sub.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}