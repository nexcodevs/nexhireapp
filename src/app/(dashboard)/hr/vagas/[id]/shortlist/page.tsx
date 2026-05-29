import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Shortlist IA — Nexhire',
}

interface ShortlistRow {
  id: string
  status: string
  submitted_at: string
  ai_score: number | null
  ai_summary: string | null
  ai_risks: unknown
  ai_gaps: unknown
  hunter_score: number | null
  hunter_score_rationale: string | null
  candidates:
    | {
        full_name: string | null
        current_title: string | null
        location: string | null
      }
    | null
  recruiters:
    | {
        users: { full_name: string | null } | { full_name: string | null }[] | null
      }
    | null
}

const statusBadge: Record<string, { label: string; variant: 'gray' | 'yellow' | 'green' | 'red' | 'blue' | 'dark' }> = {
  submitted: { label: 'Aguardando IA', variant: 'gray' },
  ai_analyzed: { label: 'Analisado', variant: 'blue' },
  hr_approved: { label: 'Aprovado', variant: 'green' },
  hr_rejected: { label: 'Reprovado', variant: 'red' },
  sent_to_client: { label: 'Enviado', variant: 'yellow' },
  client_approved: { label: 'Cliente OK', variant: 'green' },
  client_rejected: { label: 'Cliente recusou', variant: 'red' },
  interview_scheduled: { label: 'Entrevista', variant: 'blue' },
  hired: { label: 'Contratado', variant: 'dark' },
}

function scoreColor(score: number | null): { bg: string; text: string; label: string } {
  if (score === null) return { bg: 'var(--bg-elev-2)', text: 'var(--text-4)', label: 'sem score' }
  if (score >= 75) return { bg: 'var(--accent-bg)', text: 'var(--accent-text)', label: 'top match' }
  if (score >= 50) return { bg: 'var(--bg-elev-2)', text: 'var(--text-2)', label: 'médio' }
  return { bg: 'var(--bg-elev-2)', text: 'var(--text-4)', label: 'fraco' }
}

function pickOne<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

export default async function HRJobShortlistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['hr_manager', 'admin'].includes(userData?.role)) {
    redirect('/login')
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, seniority, location, work_model, companies(name)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: subsRaw } = await supabase
    .from('submissions')
    .select(
      'id, status, submitted_at, ai_score, ai_summary, ai_risks, ai_gaps, hunter_score, hunter_score_rationale, candidates(full_name, current_title, location), recruiters(users(full_name))',
    )
    .eq('job_id', id)
    .order('ai_score', { ascending: false, nullsFirst: false })
    .order('submitted_at', { ascending: false })
    .returns<ShortlistRow[]>()

  const subs = subsRaw ?? []
  const companyRel = pickOne(
    job.companies as { name: string | null } | { name: string | null }[] | null,
  )
  const company = companyRel?.name ?? null

  const stats = {
    total: subs.length,
    aguardando: subs.filter(s => s.status === 'submitted' || s.status === 'ai_analyzed').length,
    aprovados: subs.filter(s =>
      ['hr_approved', 'sent_to_client', 'client_approved', 'interview_scheduled', 'hired'].includes(s.status),
    ).length,
    reprovados: subs.filter(s => s.status === 'hr_rejected' || s.status === 'client_rejected').length,
    comScoreIA: subs.filter(s => s.ai_score !== null).length,
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <Link
          href={`/hr/vagas/${id}`}
          className="text-sm text-muted hover:text-text flex items-center gap-1 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para a vaga
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--accent-text)',
                marginBottom: '4px',
              }}
            >
              Shortlist IA
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 500,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: 'var(--text-1)',
                marginBottom: '6px',
              }}
            >
              {job.title}
            </h1>
            <div className="text-sm text-muted">
              {[company, job.seniority, job.location, job.work_model].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Aguardando" value={stats.aguardando} attention={stats.aguardando > 0} />
        <StatCard label="Aprovados" value={stats.aprovados} />
        <StatCard label="Reprovados" value={stats.reprovados} />
      </div>

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
            Candidatos ordenados por score IA
          </div>
          <div className="mono" style={{ fontSize: '10.5px', color: 'var(--text-4)' }}>
            {stats.comScoreIA}/{stats.total} com análise IA
          </div>
        </div>

        {subs.length === 0 ? (
          <div style={{ padding: '40px 22px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
              Nenhuma submissão nesta vaga ainda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-(--border-1)">
            {subs.map(sub => {
              const candidate = sub.candidates
              const recruiterRel = sub.recruiters
              const recruiterUser = recruiterRel ? pickOne(recruiterRel.users) : null
              const score = scoreColor(sub.ai_score)
              const status = statusBadge[sub.status] ?? { label: sub.status, variant: 'gray' as const }
              const risks = Array.isArray(sub.ai_risks) ? (sub.ai_risks as string[]) : []
              const gaps = Array.isArray(sub.ai_gaps) ? (sub.ai_gaps as string[]) : []
              return (
                <Link
                  key={sub.id}
                  href={`/hr/submissoes/${sub.id}`}
                  style={{
                    display: 'block',
                    padding: '18px 22px',
                    transition: 'background .15s var(--ease)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                  className="nx-shortlist-row"
                >
                  <div className="flex items-start gap-4">
                    <div
                      aria-hidden
                      style={{
                        flexShrink: 0,
                        width: '64px',
                        height: '64px',
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
                              fontFamily: 'var(--font-serif)',
                              fontStyle: 'italic',
                              fontSize: '28px',
                              color: score.text,
                              letterSpacing: '-0.03em',
                            }}
                          >
                            {sub.ai_score}
                          </div>
                          <div
                            className="mono"
                            style={{
                              fontSize: '8.5px',
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
                            fontSize: '9px',
                            color: 'var(--text-4)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            padding: '4px',
                          }}
                        >
                          sem<br />score
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'var(--text-1)',
                            letterSpacing: '-0.005em',
                          }}
                        >
                          {candidate?.full_name || 'Candidato'}
                        </div>
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                        {sub.hunter_score !== null && (
                          <span
                            className="mono"
                            style={{
                              fontSize: '10.5px',
                              color: 'var(--text-4)',
                              letterSpacing: '0.04em',
                            }}
                          >
                            Hunter score {sub.hunter_score}/10
                          </span>
                        )}
                      </div>
                      <div
                        style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '6px' }}
                      >
                        {candidate?.current_title}
                        {candidate?.location && ` · ${candidate.location}`}
                        {recruiterUser?.full_name && ` · enviado por ${recruiterUser.full_name}`}
                        {` · ${formatDate(sub.submitted_at)}`}
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
                        <div className="flex flex-wrap gap-1.5">
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
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      <style>{`
        .nx-shortlist-row:hover {
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
