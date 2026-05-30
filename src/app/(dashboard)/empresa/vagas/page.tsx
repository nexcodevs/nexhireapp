import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import JobFilters from '@/components/jobs/JobFilters'
import { formatCurrency } from '@/lib/utils'
import { requireCompany } from '@/lib/company'

export const metadata = {
  title: 'Minhas vagas — Nexhire',
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    seniority?: string
    model?: string
    type?: string
  }>
}

const statusLabel: Record<string, { label: string; variant: 'gray' | 'yellow' | 'green' | 'blue' | 'dark' | 'red' }> = {
  draft: { label: 'Rascunho', variant: 'gray' },
  pending_hr_review: { label: 'Em revisão', variant: 'yellow' },
  open_for_hunters: { label: 'Aberta', variant: 'green' },
  submission_closed: { label: 'Envios fechados', variant: 'blue' },
  in_hr_curation: { label: 'Em curadoria', variant: 'blue' },
  sent_to_client: { label: 'Aguardando você', variant: 'yellow' },
  interviewing: { label: 'Em entrevista', variant: 'blue' },
  offer: { label: 'Em proposta', variant: 'dark' },
  hired: { label: 'Contratado', variant: 'green' },
  closed: { label: 'Encerrada', variant: 'gray' },
  cancelled: { label: 'Cancelada', variant: 'red' },
}

interface JobRow {
  id: string
  title: string
  status: string
  seniority: string | null
  location: string | null
  work_model: string | null
  employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  created_at: string
  submission_deadline: string | null
}

interface JobWithStats extends JobRow {
  totalSubs: number
  pendingForCompany: number
  hired: number
  daysOpen: number
}

export default async function EmpresaVagasPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const statusFilter = sp.status?.split(',').filter(Boolean) ?? []
  const seniorityFilter = sp.seniority?.split(',').filter(Boolean) ?? []
  const modelFilter = sp.model?.split(',').filter(Boolean) ?? []
  const typeFilter = sp.type?.split(',').filter(Boolean) ?? []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const companyId = await requireCompany(supabase, user.id)

  let query = supabase
    .from('jobs')
    .select('id, title, status, seniority, location, work_model, employment_type, salary_min, salary_max, created_at, submission_deadline')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (statusFilter.length > 0) query = query.in('status', statusFilter)
  if (seniorityFilter.length > 0) query = query.in('seniority', seniorityFilter)
  if (modelFilter.length > 0) query = query.in('work_model', modelFilter)
  if (typeFilter.length > 0) query = query.in('employment_type', typeFilter)

  const { data: jobsRaw } = await query
  const jobs = (jobsRaw ?? []) as JobRow[]
  const hasFilters =
    statusFilter.length + seniorityFilter.length + modelFilter.length + typeFilter.length > 0

  const jobIds = jobs.map(j => j.id)
  const VISIBLE: string[] = [
    'sent_to_client', 'client_approved', 'client_rejected',
    'interview_scheduled', 'offer', 'hired', 'not_hired',
  ]
  const { data: visibleSubs } = jobIds.length
    ? await supabase
        .from('submissions')
        .select('job_id, status')
        .in('job_id', jobIds)
        .in('status', VISIBLE)
    : { data: [] as { job_id: string; status: string }[] }

  const subsByJob = new Map<string, { total: number; pending: number; hired: number }>()
  for (const sub of visibleSubs ?? []) {
    const cur = subsByJob.get(sub.job_id) ?? { total: 0, pending: 0, hired: 0 }
    cur.total++
    if (sub.status === 'sent_to_client') cur.pending++
    if (sub.status === 'hired') cur.hired++
    subsByJob.set(sub.job_id, cur)
  }

  const now = new Date().getTime()
  const enriched: JobWithStats[] = jobs.map(j => {
    const agg = subsByJob.get(j.id) ?? { total: 0, pending: 0, hired: 0 }
    const created = new Date(j.created_at).getTime()
    const daysOpen = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)))
    return {
      ...j,
      totalSubs: agg.total,
      pendingForCompany: agg.pending,
      hired: agg.hired,
      daysOpen,
    }
  })

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Gestão"
        title="Minhas"
        titleAccent="vagas"
        subtitle={`${jobs.length} vaga${jobs.length !== 1 ? 's' : ''} ${hasFilters ? 'após filtros' : 'no total'}`}
        action={
          <Link href="/empresa/vagas/nova">
            <Button variant="dark" size="md">
              Nova vaga
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </Link>
        }
      />

      <JobFilters
        showStatus
        resultsLabel={hasFilters ? `${jobs.length} resultado${jobs.length !== 1 ? 's' : ''}` : undefined}
      />

      {jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-12">
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '6px' }}>
              {hasFilters ? 'Nenhuma vaga corresponde aos filtros' : 'Você ainda não tem vagas'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '14px' }}>
              {hasFilters ? 'Tente remover algum filtro.' : 'Crie sua primeira vaga e receba candidatos curados.'}
            </p>
            {!hasFilters && (
              <Link href="/empresa/vagas/nova">
                <Button variant="dark" size="md">Criar primeira vaga</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <Card padding="none">
          {/* Header */}
          <div
            style={{
              padding: '10px 22px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) auto auto auto auto auto',
              gap: '12px',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-1)',
              fontFamily: 'var(--font-mono)',
              fontSize: '9.5px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
            }}
          >
            <span>Vaga</span>
            <span style={{ textAlign: 'right' }}>Recebidos</span>
            <span style={{ textAlign: 'right' }}>Aguardam.</span>
            <span style={{ textAlign: 'right' }}>Hires</span>
            <span style={{ textAlign: 'right' }}>Dias</span>
            <span style={{ textAlign: 'right' }}>Status</span>
          </div>

          <div className="flex flex-col divide-y divide-(--border-1)">
            {enriched.map(job => {
              const status = statusLabel[job.status] ?? { label: job.status, variant: 'gray' as const }
              const hasPending = job.pendingForCompany > 0
              return (
                <Link
                  key={job.id}
                  href={`/empresa/vagas/${job.id}/candidatos`}
                  style={{
                    padding: '12px 22px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 2fr) auto auto auto auto auto',
                    gap: '12px',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background .15s var(--ease)',
                    background: hasPending ? 'var(--accent-bg)' : undefined,
                  }}
                  className="nx-job-row"
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-1)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {job.title}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-4)',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {[job.seniority, job.work_model, job.employment_type].filter(Boolean).join(' · ')}
                      {job.salary_min && ` · ${formatCurrency(job.salary_min)}${job.salary_max ? `–${formatCurrency(job.salary_max)}` : '+'}`}
                    </div>
                  </div>
                  <KpiCell value={job.totalSubs} />
                  <KpiCell
                    value={job.pendingForCompany}
                    attention={job.pendingForCompany > 0}
                  />
                  <KpiCell value={job.hired} positive={job.hired > 0} />
                  <KpiCell value={`${job.daysOpen}d`} />
                  <Badge variant={status.variant} size="sm">
                    {status.label}
                  </Badge>
                </Link>
              )
            })}
          </div>
        </Card>
      )}
      <style>{`.nx-job-row:hover { background: var(--bg-elev-2); }`}</style>
    </div>
  )
}

function KpiCell({
  value,
  attention = false,
  positive = false,
}: {
  value: number | string
  attention?: boolean
  positive?: boolean
}) {
  return (
    <span
      className="mono"
      style={{
        fontSize: '12px',
        fontWeight: 500,
        color: attention
          ? 'var(--accent-text)'
          : positive
            ? 'var(--accent-text)'
            : value === 0 || value === '0d'
              ? 'var(--text-4)'
              : 'var(--text-2)',
        textAlign: 'right',
        letterSpacing: '0.02em',
        minWidth: '36px',
      }}
    >
      {value}
    </span>
  )
}
