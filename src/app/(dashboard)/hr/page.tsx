import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import KPICard from '@/components/ui/KPICard'
import InsightsCards from '@/components/dashboard/InsightsCards'
import WelcomeCard from '@/components/dashboard/WelcomeCard'

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
     <PageHeader
        eyebrow="HR Manager"
        title="Operações"
        titleAccent="da plataforma"
        subtitle="Visão geral de vagas, submissões e operações em curso."
      />

      <WelcomeCard role="hr_manager" userId={user.id} />
      <InsightsCards role="hr_manager" />

      {/* Alertas de ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/hr/vagas?status=pending_hr_review">
          <KPICard
            label="Vagas para revisar"
            value={pendingJobs || 0}
            footer={(pendingJobs || 0) > 0 ? 'Requer atenção' : 'Nenhuma pendência'}
          />
        </Link>
        <Link href="/hr/submissoes?status=submitted">
          <KPICard
            label="Submissões para curar"
            value={pendingSubmissions || 0}
            footer={(pendingSubmissions || 0) > 0 ? 'Requer atenção' : 'Nenhuma pendência'}
          />
        </Link>
        <Link href="/hr/hunters?status=pending">
          <KPICard
            label="Hunters para aprovar"
            value={pendingHunters || 0}
            footer={(pendingHunters || 0) > 0 ? 'Requer atenção' : 'Nenhuma pendência'}
          />
        </Link>
      </div>

      {/* Stats gerais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard label="Total de vagas" value={totalJobs || 0} numSize="sm" />
        <KPICard label="Vagas abertas" value={0} numSize="sm" />
        <KPICard label="Total submissões" value={0} numSize="sm" />
        <KPICard label="Contratações" value={0} numSize="sm" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vagas recentes */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-text">Vagas recentes</h2>
            <Link href="/hr/vagas" className="text-sm text-g600 hover:underline">
              Ver todas
            </Link>
          </div>
          {!recentJobs || recentJobs.length === 0 ? (
            <p className="text-sm text-subtle text-center py-6">
              Nenhuma vaga ainda.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {recentJobs.map(job => (
                <div key={job.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-text">{job.title}</div>
                    <div className="text-xs text-subtle mt-0.5">
                      {new Date(job.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full shrink-0 ml-2"
                    style={
                      job.status === 'pending_hr_review' ? { background: 'var(--warning-bg)', color: 'var(--warning-text)' } :
                      job.status === 'open_for_hunters' ? { background: 'var(--accent-bg)', color: 'var(--accent-text)' } :
                      job.status === 'hired' ? { background: 'var(--text-1)', color: 'var(--neon)' } :
                      { background: 'var(--bg-elev-2)', color: 'var(--text-3)' }
                    }
                  >
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
            <h2 className="text-base font-bold text-text">Submissões recentes</h2>
            <Link href="/hr/submissoes" className="text-sm text-g600 hover:underline">
              Ver todas
            </Link>
          </div>
          {!recentSubmissions || recentSubmissions.length === 0 ? (
            <p className="text-sm text-subtle text-center py-6">
              Nenhuma submissão ainda.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {recentSubmissions.map(sub => {
                type CandidateRel = { full_name: string | null }
                type JobRel = { title: string | null }
                const candidatesRel = sub.candidates as CandidateRel | CandidateRel[] | null | undefined
                const jobsRel = sub.jobs as JobRel | JobRel[] | null | undefined
                const candidate = Array.isArray(candidatesRel) ? candidatesRel[0] ?? null : candidatesRel ?? null
                const job = Array.isArray(jobsRel) ? jobsRel[0] ?? null : jobsRel ?? null
                return (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-text">
                      {candidate?.full_name || 'Candidato'}
                    </div>
                    <div className="text-xs text-subtle mt-0.5">
                      {job?.title || 'Vaga'}
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full shrink-0 ml-2"
                    style={
                      sub.status === 'submitted' ? { background: 'var(--bg-elev-2)', color: 'var(--text-3)' } :
                      sub.status === 'hr_approved' ? { background: 'var(--accent-bg)', color: 'var(--accent-text)' } :
                      sub.status === 'hr_rejected' ? { background: 'var(--danger-bg)', color: 'var(--danger-text)' } :
                      undefined
                    }
                  >
                    {sub.status === 'submitted' && 'Aguardando'}
                    {sub.status === 'hr_approved' && 'Aprovado'}
                    {sub.status === 'hr_rejected' && 'Reprovado'}
                    {!['submitted', 'hr_approved', 'hr_rejected'].includes(sub.status) && sub.status}
                  </span>
                </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}