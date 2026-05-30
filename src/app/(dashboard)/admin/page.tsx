import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import MetricCard from '@/components/ui/MetricCard'
import AttentionList from '@/components/ui/AttentionList'
import BarChart from '@/components/ui/BarChart'
import Card from '@/components/ui/Card'
import WelcomeCard from '@/components/dashboard/WelcomeCard'

export const metadata = {
  title: 'Plataforma — Admin Nexhire',
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

export default async function AdminDashboardPage() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const now = new Date()
  const ms30d = 30 * 24 * 60 * 60 * 1000
  const since30d = new Date(now.getTime() - ms30d).toISOString()
  const since60d = new Date(now.getTime() - 2 * ms30d).toISOString()

  // ===== Métricas atuais =====
  const [
    { count: totalCompanies },
    { count: totalHuntersApproved },
    { count: openJobs },
    { count: pendingHunters },
    { count: pendingJobs },
    { count: submissionsToCurate },
    { count: subs30d },
    { count: subsPrev30d },
    { count: hires30d },
    { count: hiresPrev30d },
  ] = await Promise.all([
    admin.from('companies').select('id', { count: 'exact', head: true }),
    admin.from('recruiters').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open_for_hunters'),
    admin.from('recruiters').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending_hr_review'),
    admin.from('submissions').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'ai_analyzed']),
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
  ])

  // ===== Sparkline 14d de submissions =====
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

  // ===== Deltas =====
  function delta(curr: number, prev: number): { value: string; direction: 'up' | 'down' | 'flat'; tone: 'positive' | 'negative' | 'neutral' } | undefined {
    if (prev === 0 && curr === 0) return undefined
    if (prev === 0) return { value: 'novo', direction: 'up', tone: 'positive' }
    const diff = curr - prev
    const pct = Math.round((diff / prev) * 100)
    if (pct === 0) return { value: '0%', direction: 'flat', tone: 'neutral' }
    return {
      value: `${Math.abs(pct)}%`,
      direction: pct > 0 ? 'up' : 'down',
      tone: pct > 0 ? 'positive' : 'negative',
    }
  }

  // ===== Top empresas por #vagas =====
  const { data: topJobsByCompanyRaw } = await admin
    .from('jobs')
    .select('company_id, companies(name)')
    .in('status', ['open_for_hunters', 'in_hr_curation', 'submission_closed'])

  const companyJobCount = new Map<string, { name: string; count: number }>()
  for (const j of topJobsByCompanyRaw ?? []) {
    const cid = j.company_id as string
    const rel = j.companies as { name: string | null } | { name: string | null }[] | null
    const cname = (Array.isArray(rel) ? rel[0]?.name : rel?.name) ?? 'Empresa'
    const cur = companyJobCount.get(cid) ?? { name: cname, count: 0 }
    cur.count++
    companyJobCount.set(cid, cur)
  }
  const topCompanies = [...companyJobCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ===== Distribuição de hunters por nível =====
  const { data: huntersByLevel } = await admin
    .from('recruiters')
    .select('level')
    .eq('status', 'approved')

  const levelBuckets = { beginner: 0, specialist: 0, top_hunter: 0 }
  for (const r of huntersByLevel ?? []) {
    const l = (r.level as keyof typeof levelBuckets) ?? 'beginner'
    if (l in levelBuckets) levelBuckets[l]++
  }

  // ===== Atenção =====
  const attention: { title: string; context?: string; count?: number; tone: 'attention' | 'positive' | 'neutral'; href: string; cta?: string }[] = []
  if ((pendingHunters ?? 0) > 0) {
    attention.push({
      title: 'Hunters aguardando aprovação',
      context: 'Revisar cadastros e liberar a rede.',
      count: pendingHunters ?? 0,
      tone: 'attention',
      href: '/admin/hunters?status=pending',
    })
  }
  if ((pendingJobs ?? 0) > 0) {
    attention.push({
      title: 'Vagas pra revisar',
      context: 'JDs criadas pelas empresas aguardando curadoria do HR.',
      count: pendingJobs ?? 0,
      tone: 'attention',
      href: '/hr/vagas',
    })
  }
  if ((submissionsToCurate ?? 0) > 0) {
    attention.push({
      title: 'Submissões na fila do HR',
      context: 'Hunters enviaram candidatos aguardando análise.',
      count: submissionsToCurate ?? 0,
      tone: 'attention',
      href: '/hr/submissoes',
    })
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Admin Nexhire"
        title="Visão da"
        titleAccent="plataforma"
        subtitle="Saúde operacional, consumo e o que precisa de atenção agora."
      />

      <WelcomeCard role="admin" userId={user.id} />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Submissões 30d"
          value={subs30d ?? 0}
          delta={delta(subs30d ?? 0, subsPrev30d ?? 0)}
          trend={trend}
          footer="vs últimos 30d"
        />
        <MetricCard
          label="Contratações 30d"
          value={hires30d ?? 0}
          delta={delta(hires30d ?? 0, hiresPrev30d ?? 0)}
          footer="vs últimos 30d"
        />
        <MetricCard
          label="Vagas abertas"
          value={openJobs ?? 0}
          footer={`${totalCompanies ?? 0} empresas ativas`}
        />
        <MetricCard
          label="Rede de hunters"
          value={totalHuntersApproved ?? 0}
          footer={pendingHunters ? `${pendingHunters} aguardando aprovação` : 'Todos aprovados'}
          attention={Boolean(pendingHunters && pendingHunters > 0)}
        />
      </div>

      {/* Atenção + Top empresas */}
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 mb-5">
        <AttentionList
          title="O que precisa de atenção"
          items={attention}
          emptyMessage="Nenhum gargalo operacional no momento."
        />

        <Card padding="md">
          <h2 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '14px' }}>
            Top empresas por vagas ativas
          </h2>
          {topCompanies.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-4)', textAlign: 'center', padding: '14px 0' }}>
              Sem vagas ativas no momento.
            </p>
          ) : (
            <BarChart
              items={topCompanies.map(c => ({ label: c.name, value: c.count }))}
              valueSuffix=" vagas"
            />
          )}
        </Card>
      </div>

      {/* Distribuição de níveis */}
      <Card padding="md">
        <h2 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '14px' }}>
          Composição da rede de hunters
        </h2>
        <BarChart
          items={[
            { label: 'Iniciante', value: levelBuckets.beginner, color: 'var(--text-3)' },
            { label: 'Especialista', value: levelBuckets.specialist, color: 'var(--accent-text)' },
            { label: 'Top Hunter', value: levelBuckets.top_hunter, color: 'var(--text-1)' },
          ]}
          valueSuffix=" hunters"
        />
      </Card>
    </div>
  )
}
