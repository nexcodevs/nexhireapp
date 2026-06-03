import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import CompanyAvatar from '@/components/empresa/CompanyAvatar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { matchScore, matchScoreVariant, matchScoreLabel } from '@/lib/match'

export const metadata = {
  title: 'Vagas — Candidato — Nexhire',
}

interface JobRow {
  id: string
  title: string
  seniority: string | null
  location: string | null
  work_model: string | null
  employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  created_at: string
  required_skills: unknown
  desired_skills: unknown
  companies: { name: string | null; logo_url: string | null } | { name: string | null; logo_url: string | null }[] | null
}

interface JobWithScore extends JobRow {
  score: number | null
}

function pickCompany(rel: JobRow['companies']): { name: string | null; logo_url: string | null } | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

export default async function CandidatoVagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: candidate } = await admin
    .from('candidates')
    .select('skills')
    .eq('user_id', user.id)
    .maybeSingle<{ skills: unknown }>()

  const candidateSkills = Array.isArray(candidate?.skills)
    ? (candidate.skills as unknown[]).filter((s): s is string => typeof s === 'string')
    : []

  const hasProfile = candidateSkills.length > 0

  const { data } = await admin
    .from('jobs')
    .select('id, title, seniority, location, work_model, employment_type, salary_min, salary_max, created_at, required_skills, desired_skills, companies(name, logo_url)')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })
    .limit(80)

  const rawJobs = (data ?? []) as JobRow[]

  const jobs: JobWithScore[] = rawJobs.map(j => ({
    ...j,
    score: hasProfile
      ? matchScore(candidateSkills, j.required_skills, j.desired_skills)
      : null,
  }))

  if (hasProfile) {
    jobs.sort((a, b) => {
      const sa = a.score ?? -1
      const sb = b.score ?? -1
      return sb - sa
    })
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Marketplace"
        title="Vagas"
        titleAccent="abertas"
        subtitle={
          hasProfile
            ? `${jobs.length} vaga${jobs.length === 1 ? '' : 's'} — ordenadas por fit com seu perfil.`
            : `${jobs.length} oportunidade${jobs.length === 1 ? '' : 's'} no momento.`
        }
      />

      {!hasProfile && (
        <Card
          padding="md"
          className="mb-5"
          style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
                Complete seu perfil pra ver matches
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                Suba um CV e a IA preenche skills, idiomas e experiência. Vagas passam a vir ordenadas por fit.
              </div>
            </div>
            <Link
              href="/candidato/perfil"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-on-dark)',
                background: 'var(--text-1)',
                padding: '8px 14px',
                borderRadius: 'var(--r-md)',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Completar perfil
            </Link>
          </div>
        </Card>
      )}

      {jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
            Nenhuma vaga aberta. Volte em breve.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => {
            const company = pickCompany(job.companies)
            return (
              <Link key={job.id} href={`/vagas/${job.id}`} style={{ textDecoration: 'none' }}>
                <Card padding="md" hover>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <CompanyAvatar
                        name={company?.name ?? null}
                        logoPath={company?.logo_url ?? null}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h2
                            style={{
                              fontSize: '15px',
                              fontWeight: 600,
                              color: 'var(--text-1)',
                              letterSpacing: '-0.005em',
                            }}
                          >
                            {job.title}
                          </h2>
                          {hasProfile && job.score !== null && (
                            <Badge variant={matchScoreVariant(job.score)} size="sm">
                              {matchScoreLabel(job.score)}
                            </Badge>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--text-3)',
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {company?.name && <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{company.name}</span>}
                          {job.seniority && <span>· {job.seniority}</span>}
                          {job.location && <span>· {job.location}</span>}
                          {job.work_model && <span>· {job.work_model}</span>}
                          {job.employment_type && <span>· {job.employment_type}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {job.salary_min ? (
                        <div
                          className="mono"
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--accent-text)',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {formatCurrency(job.salary_min)}
                          {job.salary_max ? ` — ${formatCurrency(job.salary_max)}` : '+'}
                        </div>
                      ) : (
                        <Badge variant="gray" size="sm">a combinar</Badge>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>
                        {formatDate(job.created_at)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
