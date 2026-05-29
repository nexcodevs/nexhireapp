import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import KPICard from '@/components/ui/KPICard'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils'
import type { RecruiterStatus } from '@/types/database'

export const metadata = {
  title: 'Plataforma — Admin Nexhire',
}

interface CompanyRow {
  id: string
  name: string
  industry: string | null
  size: string | null
  created_at: string
}

interface RecruiterListRow {
  id: string
  status: RecruiterStatus
  level: string
  created_at: string
  users: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  // 4 contadores em paralelo
  const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const [
    { count: totalCompanies },
    { count: totalHuntersApproved },
    { count: openJobs },
    { count: recentSubmissions },
    { count: pendingHunters },
  ] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    supabase
      .from('recruiters')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open_for_hunters'),
    supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .gte('submitted_at', thirtyDaysAgo),
    supabase
      .from('recruiters')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const { data: recentCompaniesRaw } = await supabase
    .from('companies')
    .select('id, name, industry, size, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentRecruitersRaw } = await supabase
    .from('recruiters')
    .select('id, status, level, created_at, users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(5)

  const recentCompanies = (recentCompaniesRaw ?? []) as CompanyRow[]
  const recentRecruiters = (recentRecruitersRaw ?? []) as RecruiterListRow[]

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Admin Nexhire"
        title="Visão da"
        titleAccent="plataforma"
        subtitle="Indicadores globais e atalhos pra operação master."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Empresas cadastradas" value={totalCompanies ?? 0} />
        <KPICard label="Hunters aprovados" value={totalHuntersApproved ?? 0} />
        <KPICard label="Vagas abertas" value={openJobs ?? 0} />
        <KPICard
          label="Submissões 30d"
          value={recentSubmissions ?? 0}
          footer={pendingHunters ? `${pendingHunters} hunters aguardando aprovação` : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Empresas recentes */}
        <Card padding="none">
          <div
            className="flex items-center justify-between"
            style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--border-1)' }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
              Empresas recentes
            </h2>
            <Link
              href="/admin/empresas"
              style={{ fontSize: '12.5px', color: 'var(--accent-text)', fontWeight: 500 }}
            >
              Ver todas →
            </Link>
          </div>
          {recentCompanies.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                Nenhuma empresa cadastrada ainda.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {recentCompanies.map(c => (
                <div key={c.id} style={{ padding: '14px 22px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-1)' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-4)', marginTop: '2px' }}>
                    {[c.industry, c.size, formatDate(c.created_at)].filter(Boolean).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Hunters recentes */}
        <Card padding="none">
          <div
            className="flex items-center justify-between"
            style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--border-1)' }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
              Hunters recentes
            </h2>
            <Link
              href="/admin/hunters"
              style={{ fontSize: '12.5px', color: 'var(--accent-text)', fontWeight: 500 }}
            >
              Ver todos →
            </Link>
          </div>
          {recentRecruiters.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Nenhum hunter ainda.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {recentRecruiters.map(r => {
                const u = Array.isArray(r.users) ? r.users[0] : r.users
                const name = u?.full_name || u?.email || 'Hunter'
                const statusVariant: 'green' | 'yellow' | 'red' | 'gray' =
                  r.status === 'approved'
                    ? 'green'
                    : r.status === 'pending'
                      ? 'yellow'
                      : r.status === 'rejected'
                        ? 'red'
                        : 'gray'
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: '14px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <Avatar name={name} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-1)' }}>
                        {name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-4)', marginTop: '2px' }}>
                        {formatDate(r.created_at)}
                      </div>
                    </div>
                    <Badge variant={statusVariant} size="sm">
                      {r.status === 'approved'
                        ? 'Aprovado'
                        : r.status === 'pending'
                          ? 'Pendente'
                          : r.status === 'rejected'
                            ? 'Rejeitado'
                            : 'Suspenso'}
                    </Badge>
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
