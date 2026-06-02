import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import CompanyAvatar from '@/components/empresa/CompanyAvatar'
import { formatCurrency, formatDate } from '@/lib/utils'

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
  companies: { name: string | null; logo_url: string | null } | { name: string | null; logo_url: string | null }[] | null
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

  const { data } = await admin
    .from('jobs')
    .select('id, title, seniority, location, work_model, employment_type, salary_min, salary_max, created_at, companies(name, logo_url)')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })
    .limit(80)

  const jobs = (data ?? []) as JobRow[]

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Marketplace"
        title="Vagas"
        titleAccent="abertas"
        subtitle={`${jobs.length} oportunidade${jobs.length === 1 ? '' : 's'} no momento.`}
      />

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
                        <h2
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'var(--text-1)',
                            letterSpacing: '-0.005em',
                            marginBottom: '4px',
                          }}
                        >
                          {job.title}
                        </h2>
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
