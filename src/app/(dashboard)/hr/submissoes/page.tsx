import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export const metadata = {
  title: 'Curadoria de submissões — Nexhire',
}

interface SubmissionRow {
  id: string
  status: string
  submitted_at: string
  ai_score: number | null
  ai_summary: string | null
  ai_risks: unknown
  ai_gaps: unknown
  hunter_score: number | null
  candidates:
    | { id: string; full_name: string | null; current_title: string | null; location: string | null }
    | { id: string; full_name: string | null; current_title: string | null; location: string | null }[]
    | null
  jobs:
    | { id: string; title: string | null; seniority: string | null; companies: { name: string | null } | { name: string | null }[] | null }
    | { id: string; title: string | null; seniority: string | null; companies: { name: string | null } | { name: string | null }[] | null }[]
    | null
  recruiters:
    | { id: string; level: string | null; users: { full_name: string | null } | { full_name: string | null }[] | null }
    | { id: string; level: string | null; users: { full_name: string | null } | { full_name: string | null }[] | null }[]
    | null
}

function pickOne<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

function scoreColor(score: number | null): {
  bg: string
  text: string
  label: string
} {
  if (score === null) return { bg: 'var(--bg-elev-2)', text: 'var(--text-4)', label: 'sem score' }
  if (score >= 75) return { bg: 'var(--accent-bg)', text: 'var(--accent-text)', label: 'top match' }
  if (score >= 50) return { bg: 'var(--bg-elev-2)', text: 'var(--text-2)', label: 'médio' }
  return { bg: 'var(--bg-elev-2)', text: 'var(--text-4)', label: 'fraco' }
}

const levelLabel: Record<string, { label: string; variant: 'dark' | 'blue' | 'gray' }> = {
  top_hunter: { label: 'Top Hunter', variant: 'dark' },
  specialist: { label: 'Especialista', variant: 'blue' },
  beginner: { label: 'Iniciante', variant: 'gray' },
}

export default async function FilaSubmissoesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'hr_manager' && profile?.role !== 'admin') {
    redirect('/login')
  }

  const { data: subsRaw } = await admin
    .from('submissions')
    .select(
      `id, status, submitted_at, ai_score, ai_summary, ai_risks, ai_gaps, hunter_score,
       candidates(id, full_name, current_title, location),
       jobs(id, title, seniority, companies(name)),
       recruiters(id, level, users(full_name))`,
    )
    .in('status', ['submitted', 'ai_analyzed'])
    .order('ai_score', { ascending: false, nullsFirst: false })
    .order('submitted_at', { ascending: true })
    .overrideTypes<SubmissionRow[]>()

  const subs = subsRaw ?? []

  const [{ count: pendentes }, { count: aprovados }, { count: enviados }] = await Promise.all([
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'ai_analyzed']),
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'hr_approved'),
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent_to_client'),
  ])

  const now = new Date().getTime()

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Curadoria"
        title="Candidatos para"
        titleAccent="revisar"
        subtitle="Submissões em ordem por score IA. Aprove pra mandar pro cliente ou reprove."
      />

      <div className="grid grid-cols-3 gap-3 mb-6" role="list" aria-label="Status da fila">
        <StatCard
          label="Aguardando revisão"
          value={pendentes ?? 0}
          attention={(pendentes ?? 0) > 0}
        />
        <StatCard label="Aprovados (shortlist)" value={aprovados ?? 0} />
        <StatCard label="Enviados ao cliente" value={enviados ?? 0} />
      </div>

      {subs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>
              Tudo em dia.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>
              Submissões novas aparecem aqui assim que hunters enviarem.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div
            style={{
              padding: '14px 22px',
              borderBottom: '1px solid var(--border-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
              {subs.length} submiss{subs.length === 1 ? 'ão' : 'ões'} pendente{subs.length === 1 ? '' : 's'}
            </div>
            <div className="mono" style={{ fontSize: '10.5px', color: 'var(--text-4)' }}>
              ordenado por score IA · ties por mais antigo
            </div>
          </div>

          <div className="flex flex-col divide-y divide-(--border-1)">
            {subs.map(sub => {
              const candidate = pickOne(sub.candidates)
              const job = pickOne(sub.jobs)
              const company = job ? pickOne(job.companies) : null
              const recruiter = pickOne(sub.recruiters)
              const recruiterUser = recruiter ? pickOne(recruiter.users) : null
              const diasEspera = Math.floor(
                (now - new Date(sub.submitted_at).getTime()) / (1000 * 60 * 60 * 24),
              )
              const slaWarn = diasEspera >= 2
              const score = scoreColor(sub.ai_score)
              const gaps = Array.isArray(sub.ai_gaps) ? (sub.ai_gaps as string[]) : []
              const risks = Array.isArray(sub.ai_risks) ? (sub.ai_risks as string[]) : []
              const level = recruiter?.level ?? 'beginner'
              const levelInfo = levelLabel[level] ?? levelLabel.beginner

              return (
                <Link
                  key={sub.id}
                  href={`/hr/submissoes/${sub.id}`}
                  style={{
                    display: 'block',
                    padding: '16px 22px',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background .15s var(--ease)',
                  }}
                  className="nx-row"
                >
                  <div className="flex items-start gap-4">
                    <div
                      aria-hidden
                      style={{
                        width: '56px',
                        height: '56px',
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 'var(--r-md)',
                        background: score.bg,
                        border: '1px solid var(--border-1)',
                      }}
                    >
                      {sub.ai_score !== null ? (
                        <div style={{ textAlign: 'center', lineHeight: 1 }}>
                          <div
                            style={{
                                                            fontSize: '24px',
                              color: score.text,
                              letterSpacing: '-0.03em',
                            }}
                          >
                            {sub.ai_score}
                          </div>
                          <div
                            className="mono"
                            style={{
                              fontSize: '8px',
                              color: score.text,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              marginTop: '2px',
                            }}
                          >
                            {score.label}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="mono"
                          style={{
                            fontSize: '8.5px',
                            color: 'var(--text-4)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                          }}
                        >
                          sem<br />score
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'var(--text-1)',
                            letterSpacing: '-0.005em',
                          }}
                        >
                          {candidate?.full_name || 'Candidato'}
                        </span>
                        {sub.hunter_score !== null && (
                          <span
                            className="mono"
                            style={{
                              fontSize: '10.5px',
                              color: 'var(--text-4)',
                              letterSpacing: '0.04em',
                            }}
                          >
                            Hunter {sub.hunter_score}/10
                          </span>
                        )}
                        {slaWarn && (
                          <Badge variant="yellow" size="sm">
                            SLA · {diasEspera}d
                          </Badge>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--text-3)',
                          marginBottom: sub.ai_summary || gaps.length || risks.length ? '6px' : 0,
                        }}
                      >
                        {candidate?.current_title}
                        {candidate?.location && ` · ${candidate.location}`}
                        {' · '}
                        {job?.title}
                        {company?.name && ` (${company.name})`}
                      </div>
                      {sub.ai_summary && (
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-2)',
                            lineHeight: 1.55,
                            marginBottom: gaps.length || risks.length ? '8px' : 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {sub.ai_summary}
                        </p>
                      )}
                      {(gaps.length > 0 || risks.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {gaps.slice(0, 3).map((g, i) => (
                            <Badge key={`g-${i}`} variant="yellow" size="sm">
                              {g}
                            </Badge>
                          ))}
                          {risks.slice(0, 3).map((r, i) => (
                            <Badge key={`r-${i}`} variant="red" size="sm">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div
                        className="mono"
                        style={{
                          fontSize: '10.5px',
                          color: 'var(--text-4)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Hunter {recruiterUser?.full_name || '—'}
                        <span style={{ marginLeft: '6px' }}>
                          <Badge variant={levelInfo.variant} size="sm">
                            {levelInfo.label}
                          </Badge>
                        </span>
                        <span style={{ marginLeft: '8px' }}>
                          · enviado {diasEspera === 0 ? 'hoje' : `há ${diasEspera}d`}
                        </span>
                      </div>
                    </div>

                    <div
                      aria-hidden
                      style={{
                        color: 'var(--text-4)',
                        flexShrink: 0,
                        alignSelf: 'center',
                      }}
                    >
                      →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      <style>{`
        .nx-row:hover {
          background: var(--bg-elev-1);
        }
      `}</style>
    </div>
  )
}

function StatCard({
  label,
  value,
  attention = false,
}: {
  label: string
  value: number
  attention?: boolean
}) {
  return (
    <div
      style={{
        background: attention ? 'var(--accent-bg)' : 'var(--bg-elev-1)',
        border: `1px solid ${attention ? 'var(--accent-border)' : 'var(--border-1)'}`,
        borderRadius: 'var(--r-md)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: attention ? 'var(--accent-text)' : 'var(--text-4)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 500,
          color: attention ? 'var(--accent-text)' : 'var(--text-1)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  )
}
