import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import JobFilters from '@/components/jobs/JobFilters'
import { getJobStatusLabel, getJobStatusVariant, formatDate } from '@/lib/utils'

type CompanyRel = { name: string | null }

function pickCompanyName(rel: CompanyRel | CompanyRel[] | null | undefined): string | null {
  if (!rel) return null
  if (Array.isArray(rel)) return rel[0]?.name ?? null
  return rel.name ?? null
}

export const metadata = {
  title: 'Vagas — HR Manager — Nexhire',
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    seniority?: string
    model?: string
    type?: string
  }>
}

interface JobRow {
  id: string
  title: string
  status: string
  seniority: string | null
  location: string | null
  work_model: string | null
  created_at: string
  companies: CompanyRel | CompanyRel[] | null
}

export default async function HRVagasPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const statusFilter = sp.status?.split(',').filter(Boolean) ?? []
  const seniorityFilter = sp.seniority?.split(',').filter(Boolean) ?? []
  const modelFilter = sp.model?.split(',').filter(Boolean) ?? []
  const typeFilter = sp.type?.split(',').filter(Boolean) ?? []
  const hasFilters =
    statusFilter.length + seniorityFilter.length + modelFilter.length + typeFilter.length > 0

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('jobs')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  if (statusFilter.length > 0) query = query.in('status', statusFilter)
  if (seniorityFilter.length > 0) query = query.in('seniority', seniorityFilter)
  if (modelFilter.length > 0) query = query.in('work_model', modelFilter)
  if (typeFilter.length > 0) query = query.in('employment_type', typeFilter)

  const { data: jobs } = await query
  const allJobs = (jobs ?? []) as JobRow[]

  const pending = allJobs.filter(j => j.status === 'pending_hr_review')
  const others = allJobs.filter(j => j.status !== 'pending_hr_review')
  const total = allJobs.length

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Catálogo"
        title="Todas as"
        titleAccent="vagas"
        subtitle={
          hasFilters
            ? `${total} vaga${total !== 1 ? 's' : ''} após filtros`
            : `${total} vaga${total !== 1 ? 's' : ''} no total · ${pending.length} aguardando revisão`
        }
      />

      <JobFilters
        showStatus
        resultsLabel={hasFilters ? `${total} resultado${total !== 1 ? 's' : ''}` : undefined}
      />

      {total === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-12">
            <p className="text-sm" style={{ color: 'var(--color-subtle)' }}>
              {hasFilters
                ? 'Nenhuma vaga corresponde aos filtros aplicados.'
                : 'Nenhuma vaga cadastrada ainda.'}
            </p>
            {hasFilters && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-subtle)' }}>
                Tente remover algum filtro ou limpar todos.
              </p>
            )}
          </div>
        </Card>
      ) : hasFilters ? (
        <JobsList rows={allJobs} />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--warning-text)' }}
                />
                <h2
                  className="text-xs font-semibold uppercase"
                  style={{ color: 'var(--warning-text)', letterSpacing: '0.14em' }}
                >
                  Aguardando revisão ({pending.length})
                </h2>
              </div>
              <JobsList rows={pending} pendingVariant />
            </div>
          )}

          {others.length > 0 && (
            <div>
              {pending.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--color-subtle)' }}
                  />
                  <h2
                    className="text-xs font-semibold uppercase"
                    style={{ color: 'var(--color-muted)', letterSpacing: '0.14em' }}
                  >
                    Demais vagas ({others.length})
                  </h2>
                </div>
              )}
              <JobsList rows={others} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function JobsList({ rows, pendingVariant = false }: { rows: JobRow[]; pendingVariant?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map(job => (
        <Link key={job.id} href={`/hr/vagas/${job.id}`} className="block">
          <Card padding="md" hover className="cursor-pointer">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3
                    className="text-base font-bold truncate"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {job.title}
                  </h3>
                  {pendingVariant ? (
                    <Badge variant="yellow">Em revisão</Badge>
                  ) : (
                    <Badge variant={getJobStatusVariant(job.status)}>
                      {getJobStatusLabel(job.status)}
                    </Badge>
                  )}
                </div>
                <div
                  className="flex items-center gap-2 text-xs flex-wrap"
                  style={{ color: 'var(--color-subtle)' }}
                >
                  <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>
                    {pickCompanyName(job.companies)}
                  </span>
                  {job.seniority && <span>· {job.seniority}</span>}
                  {job.location && <span>· {job.location}</span>}
                  {job.work_model && <span>· {job.work_model}</span>}
                </div>
              </div>
              <div className="text-xs shrink-0" style={{ color: 'var(--color-subtle)' }}>
                {formatDate(job.created_at)}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
