import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Empresas — Admin Nexhire',
}

interface CompanyRow {
  id: string
  name: string
  website: string | null
  industry: string | null
  size: string | null
  created_at: string
}

interface AggCounts {
  company_id: string
  total: number
  open: number
  hires: number
}

export default async function AdminEmpresasPage() {
  const supabase = createAdminClient()

  const { data: companiesRaw } = await supabase
    .from('companies')
    .select('id, name, website, industry, size, created_at')
    .order('created_at', { ascending: false })

  const companies = (companiesRaw ?? []) as CompanyRow[]

  // Conta vagas e hires por empresa (1 query cada agregação — simples e legível)
  const companyIds = companies.map(c => c.id)
  const { data: jobsAgg } = companyIds.length
    ? await supabase
        .from('jobs')
        .select('company_id, status')
        .in('company_id', companyIds)
    : { data: [] as { company_id: string; status: string }[] }

  const { data: hiredSubs } = companyIds.length
    ? await supabase
        .from('submissions')
        .select('jobs!inner(company_id)')
        .eq('status', 'hired')
        .in('jobs.company_id', companyIds)
    : { data: [] as Array<{ jobs: { company_id: string } | { company_id: string }[] | null }> }

  const aggByCompany = new Map<string, AggCounts>()
  for (const c of companies) {
    aggByCompany.set(c.id, { company_id: c.id, total: 0, open: 0, hires: 0 })
  }
  for (const j of jobsAgg ?? []) {
    const agg = aggByCompany.get(j.company_id)
    if (!agg) continue
    agg.total += 1
    if (j.status === 'open_for_hunters') agg.open += 1
  }
  for (const h of hiredSubs ?? []) {
    const jobsRel = h.jobs as { company_id: string } | { company_id: string }[] | null
    const cid = Array.isArray(jobsRel) ? jobsRel[0]?.company_id : jobsRel?.company_id
    if (!cid) continue
    const agg = aggByCompany.get(cid)
    if (agg) agg.hires += 1
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Admin Nexhire"
        title="Empresas"
        titleAccent="cadastradas"
        subtitle={`${companies.length} empresa${companies.length !== 1 ? 's' : ''} na plataforma.`}
      />

      {companies.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>
              Nenhuma empresa cadastrada ainda.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map(c => {
            const agg = aggByCompany.get(c.id) ?? { total: 0, open: 0, hires: 0 }
            return (
              <Card key={c.id} padding="md">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: 'var(--text-1)',
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {c.name}
                      </h2>
                      {c.industry && (
                        <Badge variant="purple" size="sm">
                          {c.industry}
                        </Badge>
                      )}
                      {c.size && (
                        <Badge variant="gray" size="sm">
                          {c.size}
                        </Badge>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-3 flex-wrap"
                      style={{ fontSize: '12.5px', color: 'var(--text-3)' }}
                    >
                      {c.website && (
                        <a
                          href={
                            c.website.startsWith('http') ? c.website : `https://${c.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--accent-text)',
                            textDecoration: 'underline',
                          }}
                        >
                          {c.website}
                        </a>
                      )}
                      <span>Cadastrada em {formatDate(c.created_at)}</span>
                    </div>
                  </div>

                  {/* Stats à direita */}
                  <div
                    className="flex items-center gap-6"
                    style={{ flexShrink: 0 }}
                  >
                    <CompanyStat label="Vagas" value={agg.total} />
                    <CompanyStat label="Abertas" value={agg.open} highlight={agg.open > 0} />
                    <CompanyStat label="Hires" value={agg.hires} />
                  </div>
                </div>

                {/* Footer actions */}
                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-1)',
                    display: 'flex',
                    gap: '12px',
                    fontSize: '12px',
                  }}
                >
                  <Link
                    href={`/hr/vagas?company=${c.id}`}
                    style={{ color: 'var(--accent-text)', fontWeight: 500 }}
                  >
                    Ver vagas →
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CompanyStat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div
        className="it"
        style={{
          fontSize: '24px',
          lineHeight: 1,
          color: highlight ? 'var(--accent-text)' : 'var(--text-1)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9.5px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          marginTop: '2px',
        }}
      >
        {label}
      </div>
    </div>
  )
}
