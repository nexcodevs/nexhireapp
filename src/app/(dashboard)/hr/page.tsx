import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import MetricCard from '@/components/ui/MetricCard'
import AttentionList from '@/components/ui/AttentionList'
import Funnel from '@/components/ui/Funnel'
import Card from '@/components/ui/Card'
import WelcomeCard from '@/components/dashboard/WelcomeCard'

export const metadata = {
  title: 'Dashboard HR — Nexhire',
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

export default async function HRDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: userData } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!['hr_manager', 'admin'].includes(userData?.role)) {
    redirect('/login')
  }

  const now = new Date()
  const ms30d = 30 * 24 * 60 * 60 * 1000
  const since30d = new Date(now.getTime() - ms30d).toISOString()
  const since60d = new Date(now.getTime() - 2 * ms30d).toISOString()

  const [
    { count: pendingJobs },
    { count: pendingSubmissions },
    { count: pendingHunters },
    { count: openJobs },
    { count: sentToClient },
    { count: subs30d },
    { count: subsPrev30d },
    { count: hires30d },
    { count: hiresPrev30d },
    { count: rejected30d },
  ] = await Promise.all([
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending_hr_review'),
    admin.from('submissions').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'ai_analyzed']),
    admin.from('recruiters').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open_for_hunters'),
    admin.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'sent_to_client'),
    admin.from('submissions').select('id', { count: 'exact', head: true }).gte('submitted_at', since30d),
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .gte('submitted_at', since60d)
      .lt('submitted_at', since30d),
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'hired')
      .gte('hired_at', since30d),
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'hired')
      .gte('hired_at', since60d)
      .lt('hired_at', since30d),
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'hr_rejected')
      .gte('submitted_at', since30d),
  ])

  // Sparkline 14d
  const since14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentSubs } = await admin
    .from('submissions')
    .select('submitted_at')
    .gte('submitted_at', since14d)

  const dayBuckets = new Map<string, number>()
  for (const s of recentSubs ?? []) {
    const k = dayKey(new Date(s.submitted_at))
    dayBuckets.set(k, (dayBuckets.get(k) ?? 0) + 1)
  }
  const trend = lastNDays(14).map(d => dayBuckets.get(d) ?? 0)

  // Funil
  const { data: allSubs } = await admin
    .from('submissions')
    .select('status')
    .gte('submitted_at', since30d)

  const statusCount = new Map<string, number>()
  for (const s of allSubs ?? []) {
    statusCount.set(s.status, (statusCount.get(s.status) ?? 0) + 1)
  }
  const funnel = [
    { label: 'Recebidos', value: allSubs?.length ?? 0, color: 'var(--text-3)' },
    {
      label: 'Aprovados pelo HR',
      value:
        (statusCount.get('hr_approved') ?? 0) +
        (statusCount.get('sent_to_client') ?? 0) +
        (statusCount.get('client_approved') ?? 0) +
        (statusCount.get('client_rejected') ?? 0) +
        (statusCount.get('interview_scheduled') ?? 0) +
        (statusCount.get('offer') ?? 0) +
        (statusCount.get('hired') ?? 0) +
        (statusCount.get('not_hired') ?? 0),
      color: 'var(--accent-text)',
    },
    {
      label: 'Aprovados pelo cliente',
      value:
        (statusCount.get('client_approved') ?? 0) +
        (statusCount.get('interview_scheduled') ?? 0) +
        (statusCount.get('offer') ?? 0) +
        (statusCount.get('hired') ?? 0),
      color: 'var(--accent-text)',
    },
    {
      label: 'Em entrevista',
      value: statusCount.get('interview_scheduled') ?? 0,
      color: 'var(--text-2)',
    },
    {
      label: 'Contratados',
      value: statusCount.get('hired') ?? 0,
      color: 'var(--text-1)',
    },
  ]

  // Taxas
  function delta(curr: number, prev: number) {
    if (prev === 0 && curr === 0) return undefined
    if (prev === 0) return { value: 'novo', direction: 'up' as const, tone: 'positive' as const }
    const diff = curr - prev
    const pct = Math.round((diff / prev) * 100)
    return {
      value: `${Math.abs(pct)}%`,
      direction: pct > 0 ? ('up' as const) : pct < 0 ? ('down' as const) : ('flat' as const),
      tone: pct > 0 ? ('positive' as const) : pct < 0 ? ('negative' as const) : ('neutral' as const),
    }
  }

  const conversionRate =
    (subs30d ?? 0) > 0 ? Math.round((((hires30d ?? 0) / (subs30d ?? 1)) * 100)) : 0

  // Atenção
  const attention: { title: string; context?: string; count?: number; tone: 'attention' | 'positive' | 'neutral'; href: string; cta?: string }[] = []
  if ((pendingSubmissions ?? 0) > 0) {
    attention.push({
      title: 'Submissões pra curar',
      context: 'Hunters enviaram candidatos aguardando análise.',
      count: pendingSubmissions ?? 0,
      tone: 'attention',
      href: '/hr/submissoes',
    })
  }
  if ((pendingJobs ?? 0) > 0) {
    attention.push({
      title: 'Vagas pra revisar',
      context: 'JDs criadas pelas empresas aguardando aprovação.',
      count: pendingJobs ?? 0,
      tone: 'attention',
      href: '/hr/vagas',
    })
  }
  if ((pendingHunters ?? 0) > 0) {
    attention.push({
      title: 'Hunters pra aprovar',
      context: 'Novos hunters cadastrados aguardando.',
      count: pendingHunters ?? 0,
      tone: 'attention',
      href: '/hr/hunters?status=pending',
    })
  }
  if ((sentToClient ?? 0) > 0) {
    attention.push({
      title: 'Candidatos no cliente',
      context: 'Aguardando decisão da empresa.',
      count: sentToClient ?? 0,
      tone: 'neutral',
      href: '/hr/pipeline',
    })
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="HR Manager"
        title="Operações"
        titleAccent="da plataforma"
        subtitle="Saúde da curadoria, fila atual e taxa de conversão dos últimos 30 dias."
      />

      <WelcomeCard role="hr_manager" userId={user.id} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Submissões 30d"
          value={subs30d ?? 0}
          delta={delta(subs30d ?? 0, subsPrev30d ?? 0)}
          trend={trend}
          footer="entrada de candidatos"
        />
        <MetricCard
          label="Contratações 30d"
          value={hires30d ?? 0}
          delta={delta(hires30d ?? 0, hiresPrev30d ?? 0)}
          footer="status hired"
        />
        <MetricCard
          label="Taxa de conversão"
          value={`${conversionRate}%`}
          footer="contratados / submissões"
        />
        <MetricCard
          label="Reprovados 30d"
          value={rejected30d ?? 0}
          footer="hr_rejected"
        />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 mb-5">
        <AttentionList
          title="O que precisa de atenção"
          items={attention}
          emptyMessage="Fila zerada. Bom trabalho."
        />

        <Card padding="md">
          <h2 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '14px' }}>
            Funil dos últimos 30 dias
          </h2>
          <Funnel stages={funnel} />
        </Card>
      </div>

      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)' }}>
            Estado atual
          </h2>
          <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-4)' }}>
            tempo real
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Vagas abertas" value={openJobs ?? 0} numSize="sm" />
          <MetricCard label="Pra curar agora" value={pendingSubmissions ?? 0} numSize="sm" attention={(pendingSubmissions ?? 0) > 0} />
          <MetricCard label="No cliente" value={sentToClient ?? 0} numSize="sm" />
          <MetricCard label="Vagas pendentes" value={pendingJobs ?? 0} numSize="sm" attention={(pendingJobs ?? 0) > 0} />
        </div>
      </Card>
    </div>
  )
}
