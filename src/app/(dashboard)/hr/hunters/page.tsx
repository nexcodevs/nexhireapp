import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import HunterApprovalActions from './HunterApprovalActions'
import { formatDate } from '@/lib/utils'
import type { RecruiterStatus } from '@/types/database'

export const metadata = {
  title: 'Hunters — HR Manager — Nexhire',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

interface RecruiterRow {
  id: string
  user_id: string
  status: RecruiterStatus
  level: string
  linkedin_url: string | null
  specialties: string[] | null
  bio: string | null
  years_experience: number | null
  ai_risk_assessment: AIRiskAssessment | null
  score: number | null
  created_at: string
  users: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null
}

interface AIRiskAssessment {
  decision: 'auto_approve' | 'needs_review' | 'reject'
  confidence: number
  reasoning: string
  red_flags: string[]
}

const TAB_OPTIONS: { value: RecruiterStatus; label: string }[] = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'rejected', label: 'Rejeitados' },
  { value: 'suspended', label: 'Suspensos' },
]

export default async function HRHuntersPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const activeStatus = (
    ['pending', 'approved', 'rejected', 'suspended'].includes(sp.status ?? '')
      ? sp.status
      : 'approved'
  ) as RecruiterStatus

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: userData } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!['hr_manager', 'admin'].includes(userData?.role || '')) {
    redirect('/login')
  }

  const { data: recruiters } = await admin
    .from('recruiters')
    .select(
      'id, user_id, status, level, linkedin_url, specialties, bio, years_experience, ai_risk_assessment, score, created_at, users(full_name, email)',
    )
    .eq('status', activeStatus)
    .order('created_at', { ascending: false })

  const rows = (recruiters ?? []) as RecruiterRow[]

  // Conta por status (usado nas tabs)
  const counts = await Promise.all(
    TAB_OPTIONS.map(opt =>
      admin
        .from('recruiters')
        .select('id', { count: 'exact', head: true })
        .eq('status', opt.value)
        .then(r => ({ status: opt.value, count: r.count ?? 0 })),
    ),
  )

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="HR Manager"
        title="Hunters"
        titleAccent="da rede"
        subtitle="Aprove novos hunters, revise decisões da IA e gerencie a rede."
      />

      {/* Tabs */}
      <div
        role="tablist"
        style={{
          display: 'inline-flex',
          background: 'var(--bg-elev-2)',
          padding: '4px',
          borderRadius: 'var(--r-full)',
          border: '1px solid var(--border-1)',
          gap: '2px',
          marginBottom: '24px',
        }}
      >
        {TAB_OPTIONS.map(opt => {
          const isActive = opt.value === activeStatus
          const count = counts.find(c => c.status === opt.value)?.count ?? 0
          return (
            <a
              key={opt.value}
              href={`/hr/hunters?status=${opt.value}`}
              role="tab"
              aria-selected={isActive}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--r-full)',
                fontSize: '12px',
                fontWeight: 500,
                color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                background: isActive ? 'var(--bg-elev-1)' : 'transparent',
                boxShadow: isActive ? 'var(--shadow-1)' : 'none',
                textDecoration: 'none',
                transition: 'all .15s var(--ease)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {opt.label}
              <span
                className="mono"
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: isActive ? 'var(--text-3)' : 'var(--text-4)',
                  padding: '1px 6px',
                  borderRadius: 'var(--r-full)',
                  background: isActive ? 'var(--bg-elev-2)' : 'transparent',
                }}
              >
                {count}
              </span>
            </a>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>
              Nenhum hunter com status {TAB_OPTIONS.find(o => o.value === activeStatus)?.label.toLowerCase()}.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(r => {
            const userRel = Array.isArray(r.users) ? r.users[0] : r.users
            const name = userRel?.full_name || userRel?.email || 'Hunter'
            const ai = r.ai_risk_assessment

            return (
              <Card key={r.id} padding="md">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <Avatar name={name} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: 'var(--text-1)',
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {name}
                      </h2>
                      <Badge
                        variant={
                          r.level === 'top_hunter'
                            ? 'dark'
                            : r.level === 'specialist'
                              ? 'blue'
                              : 'gray'
                        }
                        size="sm"
                      >
                        {r.level === 'beginner'
                          ? 'Iniciante'
                          : r.level === 'specialist'
                            ? 'Especialista'
                            : 'Top Hunter'}
                      </Badge>
                      {ai && (
                        <Badge
                          variant={
                            ai.decision === 'auto_approve'
                              ? 'green'
                              : ai.decision === 'reject'
                                ? 'red'
                                : 'yellow'
                          }
                          size="sm"
                        >
                          IA: {ai.decision === 'auto_approve' ? 'Auto-aprovar' : ai.decision === 'reject' ? 'Rejeitar' : 'Revisar'}
                        </Badge>
                      )}
                    </div>

                    {/* Contato */}
                    <div
                      className="flex items-center gap-2 flex-wrap"
                      style={{ fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '8px' }}
                    >
                      <span>{userRel?.email}</span>
                      {r.linkedin_url && (
                        <>
                          <span>·</span>
                          <a
                            href={r.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-text)', textDecoration: 'underline' }}
                          >
                            LinkedIn
                          </a>
                        </>
                      )}
                      <span>·</span>
                      <span>Cadastro {formatDate(r.created_at)}</span>
                    </div>

                    {/* Bio */}
                    {r.bio && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-2)',
                          lineHeight: 1.55,
                          marginBottom: '10px',
                        }}
                      >
                        {r.bio}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap gap-2" style={{ marginBottom: ai ? '12px' : 0 }}>
                      {typeof r.years_experience === 'number' && (
                        <Badge variant="gray" size="sm">
                          {r.years_experience} {r.years_experience === 1 ? 'ano' : 'anos'} em recrutamento
                        </Badge>
                      )}
                      {(r.specialties ?? []).map(s => (
                        <Badge key={s} variant="purple" size="sm">
                          {s}
                        </Badge>
                      ))}
                    </div>

                    {/* AI assessment */}
                    {ai && (
                      <div
                        style={{
                          background: 'var(--bg-elev-2)',
                          border: '1px solid var(--border-1)',
                          borderRadius: 'var(--r-md)',
                          padding: '10px 12px',
                          marginBottom: '12px',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9.5px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--text-4)',
                            marginBottom: '4px',
                          }}
                        >
                          Análise da IA · confiança {ai.confidence}%
                        </div>
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--text-2)',
                            lineHeight: 1.5,
                          }}
                        >
                          {ai.reasoning}
                        </p>
                        {ai.red_flags && ai.red_flags.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {ai.red_flags.map((f, i) => (
                              <Badge key={i} variant="red" size="sm">
                                {f}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {activeStatus !== 'rejected' && (
                      <HunterApprovalActions
                        recruiterId={r.id}
                        currentStatus={r.status}
                      />
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
