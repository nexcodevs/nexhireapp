import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import RecomputeScoresButton from '@/components/admin/RecomputeScoresButton'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils'
import type { RecruiterStatus, RecruiterLevel } from '@/types/database'

export const metadata = {
  title: 'Hunters — Admin Nexhire',
}

interface RecruiterRow {
  id: string
  user_id: string
  status: RecruiterStatus
  level: RecruiterLevel
  score: number
  created_at: string
  specialties: string[] | null
  users: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null
}

interface RecruiterScore {
  recruiter_id: string
  total_submissions: number | null
  total_hires: number | null
  hr_approval_rate: number | null
  client_approval_rate: number | null
}

const statusLabel: Record<RecruiterStatus, { label: string; variant: 'green' | 'yellow' | 'red' | 'gray' }> = {
  approved: { label: 'Aprovado', variant: 'green' },
  pending: { label: 'Pendente', variant: 'yellow' },
  rejected: { label: 'Rejeitado', variant: 'red' },
  suspended: { label: 'Suspenso', variant: 'gray' },
}

const levelLabel: Record<RecruiterLevel, { label: string; variant: 'dark' | 'blue' | 'gray' }> = {
  top_hunter: { label: 'Top Hunter', variant: 'dark' },
  specialist: { label: 'Especialista', variant: 'blue' },
  beginner: { label: 'Iniciante', variant: 'gray' },
}

export default async function AdminHuntersPage() {
  const supabase = createAdminClient()

  const { data: recruitersRaw } = await supabase
    .from('recruiters')
    .select(
      'id, user_id, status, level, score, created_at, specialties, users(full_name, email)',
    )
    .order('created_at', { ascending: false })

  const recruiters = (recruitersRaw ?? []) as RecruiterRow[]
  const recruiterIds = recruiters.map(r => r.id)

  const { data: scoresRaw } = recruiterIds.length
    ? await supabase
        .from('recruiter_scores')
        .select('recruiter_id, total_submissions, total_hires, hr_approval_rate, client_approval_rate')
        .in('recruiter_id', recruiterIds)
    : { data: [] as RecruiterScore[] }

  const scoreById = new Map<string, RecruiterScore>()
  for (const s of (scoresRaw ?? []) as RecruiterScore[]) {
    scoreById.set(s.recruiter_id, s)
  }

  const stats = {
    total: recruiters.length,
    approved: recruiters.filter(r => r.status === 'approved').length,
    pending: recruiters.filter(r => r.status === 'pending').length,
    rejected: recruiters.filter(r => r.status === 'rejected').length,
    suspended: recruiters.filter(r => r.status === 'suspended').length,
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Admin Nexhire"
        title="Rede de"
        titleAccent="hunters"
        subtitle="Visão global. Pra aprovação operacional dos novos, use Curadoria HR."
        action={<RecomputeScoresButton />}
      />

      {/* Quick stats */}
      <div
        className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6"
        role="list"
        aria-label="Distribuição de hunters por status"
      >
        {[
          { label: 'Total', value: stats.total },
          { label: 'Aprovados', value: stats.approved },
          { label: 'Pendentes', value: stats.pending },
          { label: 'Rejeitados', value: stats.rejected },
          { label: 'Suspensos', value: stats.suspended },
        ].map(s => (
          <div
            key={s.label}
            role="listitem"
            style={{
              background: 'var(--bg-elev-1)',
              border: '1px solid var(--border-1)',
              borderRadius: 'var(--r-lg)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9.5px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-4)',
                marginBottom: '6px',
              }}
            >
              {s.label}
            </div>
            <div
              className="it"
              style={{
                fontSize: '28px',
                lineHeight: 1,
                color: 'var(--text-1)',
                letterSpacing: '-0.02em',
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Lista */}
      {recruiters.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>
              Nenhum hunter cadastrado ainda.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 80px 80px 80px 100px',
              gap: '12px',
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-1)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              fontWeight: 600,
            }}
          >
            <div>Hunter</div>
            <div>Status</div>
            <div>Nível</div>
            <div style={{ textAlign: 'right' }}>Envios</div>
            <div style={{ textAlign: 'right' }}>Hires</div>
            <div style={{ textAlign: 'right' }}>HR Apr.</div>
            <div style={{ textAlign: 'right' }}>Cadastro</div>
          </div>
          {recruiters.map(r => {
            const u = Array.isArray(r.users) ? r.users[0] : r.users
            const name = u?.full_name || u?.email || 'Hunter'
            const sc = scoreById.get(r.id)
            const hrApprovalPct = sc?.hr_approval_rate ?? 0
            return (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 80px 80px 80px 100px',
                  gap: '12px',
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border-1)',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <Avatar name={name} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-1)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-4)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {u?.email}
                    </div>
                  </div>
                </div>
                <div>
                  <Badge variant={statusLabel[r.status].variant} size="sm">
                    {statusLabel[r.status].label}
                  </Badge>
                </div>
                <div>
                  <Badge variant={levelLabel[r.level].variant} size="sm">
                    {levelLabel[r.level].label}
                  </Badge>
                </div>
                <div
                  className="mono"
                  style={{
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-2)',
                  }}
                >
                  {sc?.total_submissions ?? 0}
                </div>
                <div
                  className="it"
                  style={{
                    textAlign: 'right',
                    fontSize: '18px',
                    color: (sc?.total_hires ?? 0) > 0 ? 'var(--accent-text)' : 'var(--text-3)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {sc?.total_hires ?? 0}
                </div>
                <div
                  className="mono"
                  style={{
                    textAlign: 'right',
                    fontSize: '12px',
                    color: 'var(--text-3)',
                  }}
                >
                  {hrApprovalPct ? `${Number(hrApprovalPct).toFixed(0)}%` : '—'}
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '11px',
                    color: 'var(--text-4)',
                  }}
                >
                  {formatDate(r.created_at)}
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
