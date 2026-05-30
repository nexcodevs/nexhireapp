import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import MetricCard from '@/components/ui/MetricCard'
import AttentionList from '@/components/ui/AttentionList'
import BarChart from '@/components/ui/BarChart'
import Card from '@/components/ui/Card'
import WelcomeCard from '@/components/dashboard/WelcomeCard'
import { requireCompany } from '@/lib/company'

export const metadata = {
  title: 'Dashboard — Nexhire',
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function lastNDays(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    out.push(dayKey(d))
  }
  return out
}

export default async function EmpresaDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!['company_user', 'admin'].includes(userData?.role || '')) {
    redirect('/login')
  }

  const companyId = await requireCompany(supabase, user.id)
  const admin = createAdminClient()
  const now = new Date()
  const ms30d = 30 * 24 * 60 * 60 * 1000
  const since30d = new Date(now.getTime() - ms30d).toISOString()

  const { data: companyRow } = await admin
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()
  const companyName = companyRow?.name ?? null

  const { data: companyJobs } = await admin
    .from('jobs')
    .select('id, title, status, created_at')
    .eq('company_id', companyId)
  const jobIds = (companyJobs ?? []).map(j => j.id)

  const [
    { count: openJobs },
    { count: jobsInCuration },
    { count: pendingHR },
    { count: pendingForCompany },
    { count: interviewing },
    { count: hiredCount },
    { count: hired30d },
  ] = jobIds.length > 0
    ? await Promise.all([
        admin.from('jobs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'open_for_hunters'),
        admin.from('jobs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'in_hr_curation'),
        admin.from('jobs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending_hr_review'),
        admin.from('submissions').select('id', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'sent_to_client'),
        admin.from('submissions').select('id', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'interview_scheduled'),
        admin.from('submissions').select('id', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'hired'),
        admin.from('submissions').select('id', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'hired').gte('hired_at', since30d),
      ])
    : [
        { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 },
        { count: 0 }, { count: 0 }, { count: 0 },
      ]

  // Funil
  let funnel = [
    { label: 'Recebidos', value: 0, color: 'var(--text-3)' },
    { label: 'No cliente', value: 0, color: 'var(--accent-text)' },
    { label: 'Aprovados', value: 0, color: 'var(--accent-text)' },
    { label: 'Em entrevista', value: 0, color: 'var(--text-2)' },
    { label: 'Contratados', value: 0, color: 'var(--text-1)' },
  ]

  if (jobIds.length > 0) {
    const { data: allSubs } = await admin
      .from('submissions')
      .select('status, submitted_at, hired_at')
      .in('job_id', jobIds)
      .in('status', ['sent_to_client', 'client_approved', 'client_rejected', 'interview_scheduled', 'offer', 'hired', 'not_hired'])

    const subs = allSubs ?? []
    funnel = [
      { label: 'Recebidos', value: subs.length, color: 'var(--text-3)' },
      { label: 'No cliente (aguardando)', value: subs.filter(s => s.status === 'sent_to_client').length, color: 'var(--warning-text)' },
      { label: 'Aprovados', value: subs.filter(s => ['client_approved', 'interview_scheduled', 'offer', 'hired'].includes(s.status)).length, color: 'var(--accent-text)' },
      { label: 'Em entrevista', value: subs.filter(s => s.status === 'interview_scheduled').length, color: 'var(--text-2)' },
      { label: 'Contratados', value: subs.filter(s => s.status === 'hired').length, color: 'var(--text-1)' },
    ]
  }

  // Sparkline 14d de submissões recebidas
  const since14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  let trend: number[] = []
  if (jobIds.length > 0) {
    const { data: recentSubs } = await admin
      .from('submissions')
      .select('submitted_at')
      .in('job_id', jobIds)
      .gte('submitted_at', since14d)
    const dayBuckets = new Map<string, number>()
    for (const s of recentSubs ?? []) {
      const k = dayKey(new Date(s.submitted_at))
      dayBuckets.set(k, (dayBuckets.get(k) ?? 0) + 1)
    }
    trend = lastNDays(14).map(d => dayBuckets.get(d) ?? 0)
  }

  // Atenção
  const attention: { title: string; context?: string; count?: number; tone: 'attention' | 'positive' | 'neutral'; href: string; cta?: string }[] = []
  if ((pendingForCompany ?? 0) > 0) {
    attention.push({
      title: 'Candidatos aguardando sua decisão',
      context: 'HR já curou — agora você decide se aprova ou não.',
      count: pendingForCompany ?? 0,
      tone: 'attention',
      href: '/empresa/candidatos',
    })
  }
  if ((pendingHR ?? 0) > 0) {
    attention.push({
      title: 'Vagas em revisão pelo HR',
      context: 'HR está revisando antes de liberar pros hunters.',
      count: pendingHR ?? 0,
      tone: 'neutral',
      href: '/empresa/vagas',
    })
  }
  if ((jobsInCuration ?? 0) > 0) {
    attention.push({
      title: 'Vagas em curadoria de candidatos',
      context: 'Hunters enviando, HR triando.',
      count: jobsInCuration ?? 0,
      tone: 'neutral',
      href: '/empresa/vagas',
    })
  }

  const firstName = userData?.full_name?.split(' ')[0] || companyName || 'time'

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Painel da empresa"
        title="Olá,"
        titleAccent={firstName}
        subtitle={companyName ? `Visão da ${companyName} — pipeline e indicadores de contratação.` : 'Pipeline e indicadores de contratação.'}
        action={
          <Link href="/empresa/vagas/nova">
            <Button variant="dark" size="md">
              Nova vaga
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </Link>
        }
      />

      <WelcomeCard role="company_user" userId={user.id} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Vagas ativas"
          value={(openJobs ?? 0) + (jobsInCuration ?? 0)}
          footer={`${openJobs ?? 0} abertas · ${jobsInCuration ?? 0} em curadoria`}
        />
        <MetricCard
          label="Aguardando você"
          value={pendingForCompany ?? 0}
          footer="candidatos pra decidir"
          attention={(pendingForCompany ?? 0) > 0}
          trend={trend.length > 0 ? trend : undefined}
        />
        <MetricCard
          label="Em entrevista"
          value={interviewing ?? 0}
          footer="processos ativos"
        />
        <MetricCard
          label="Contratações 30d"
          value={hired30d ?? 0}
          footer={`${hiredCount ?? 0} no total`}
        />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 mb-5">
        <AttentionList
          title="O que precisa de atenção"
          items={attention}
          emptyMessage="Sem pendências. Crie uma vaga nova se quiser contratar."
        />

        <Card padding="md">
          <h2 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '14px' }}>
            Funil de candidatos
          </h2>
          {funnel[0].value === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-4)', textAlign: 'center', padding: '18px 0' }}>
              Sem candidatos recebidos ainda.
            </p>
          ) : (
            <BarChart items={funnel} max={funnel[0]?.value || 1} />
          )}
        </Card>
      </div>

      {companyJobs && companyJobs.length === 0 && (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '6px' }}>
              Você ainda não criou nenhuma vaga.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '14px' }}>
              Comece criando sua primeira vaga — IA + hunters + curadoria pronta pra trabalhar.
            </p>
            <Link href="/empresa/vagas/nova">
              <Button variant="dark" size="md">Criar primeira vaga</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
