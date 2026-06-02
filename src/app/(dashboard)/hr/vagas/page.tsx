import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import JobFilters from '@/components/jobs/JobFilters'
import { getJobStatusLabel, getJobStatusVariant } from '@/lib/utils'

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
  employment_type: string | null
  created_at: string
  submission_deadline: string | null
  companies: CompanyRel | CompanyRel[] | null
}

interface JobWithKPIs extends JobRow {
  totalSubs: number
  pendingSubs: number
  approvedSubs: number
  hires: number
  daysOpen: number
  pctOfDeadline: number | null
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

  const admin = createAdminClient()

  let query = admin
    .from('jobs')
    .select('id, title, status, seniority, location, work_model, employment_type, created_at, submission_deadline, companies(name)')
    .order('created_at', { ascending: false })

  if (statusFilter.length > 0) query = query.in('status', statusFilter)
  if (seniorityFilter.length > 0) query = query.in('seniority', seniorityFilter)
  if (modelFilter.length > 0) query = query.in('work_model', modelFilter)
  if (typeFilter.length > 0) query = query.in('employment_type', typeFilter)

  const { data: jobs } = await query
  const allJobs = (jobs ?? []) as JobRow[]
  const jobIds = allJobs.map(j => j.id)

  // Agrega submissões por vaga
  const submissionsByJob = new Map<string, { total: number; pending: number; approved: number; hired: number }>()
  if (jobIds.length > 0) {
    const { data: subs } = await admin
      .from('submissions')
      .select('job_id, status')
      .in('job_id', jobIds)
    for (const s of subs ?? []) {
      const cur = submissionsByJob.get(s.job_id) ?? { total: 0, pending: 0, approved: 0, hired: 0 }
      cur.total += 1
      if (s.status === 'submitted' || s.status === 'ai_analyzed') cur.pending += 1
      if (['hr_approved', 'sent_to_client', 'client_approved', 'interview_scheduled', 'offer', 'hired', 'not_hired'].includes(s.status)) cur.approved += 1
      if (s.status === 'hired') cur.hired += 1
      submissionsByJob.set(s.job_id, cur)
    }
  }

  const now = new Date().getTime()
  const enriched: JobWithKPIs[] = allJobs.map(j => {
    const agg = submissionsByJob.get(j.id) ?? { total: 0, pending: 0, approved: 0, hired: 0 }
    const created = new Date(j.created_at).getTime()
    const daysOpen = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)))
    let pctOfDeadline: number | null = null
    if (j.submission_deadline) {
      const deadline = new Date(j.submission_deadline).getTime()
      const totalSpan = deadline - created
      if (totalSpan > 0) {
        pctOfDeadline = Math.min(100, Math.round(((now - created) / totalSpan) * 100))
      }
    }
    return {
      ...j,
      totalSubs: agg.total,
      pendingSubs: agg.pending,
      approvedSubs: agg.approved,
      hires: agg.hired,
      daysOpen,
      pctOfDeadline,
    }
  })

  const pending = enriched.filter(j => j.status === 'pending_hr_review')
  const others = enriched.filter(j => j.status !== 'pending_hr_review')
  const total = enriched.length

  return (
    <div className="max-w-6xl">
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
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>
              {hasFilters
                ? 'Nenhuma vaga corresponde aos filtros aplicados.'
                : 'Nenhuma vaga cadastrada ainda.'}
            </p>
          </div>
        </Card>
      ) : hasFilters ? (
        <JobsTable rows={enriched} />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <SectionTitle tone="warning">Aguardando revisão ({pending.length})</SectionTitle>
              <JobsTable rows={pending} highlightStatus="pending" />
            </div>
          )}
          {others.length > 0 && (
            <div>
              {pending.length > 0 && <SectionTitle>Demais vagas ({others.length})</SectionTitle>}
              <JobsTable rows={others} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SectionTitle({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'warning'
}) {
  const color = tone === 'warning' ? 'var(--warning-text)' : 'var(--text-4)'
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <h2
        className="font-mono"
        style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color,
        }}
      >
        {children}
      </h2>
    </div>
  )
}

function JobsTable({
  rows,
  highlightStatus,
}: {
  rows: JobWithKPIs[]
  highlightStatus?: 'pending'
}) {
  return (
    <Card padding="none">
      <div
        style={{
          padding: '10px 22px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) auto auto auto auto auto auto',
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
        <span style={{ textAlign: 'right' }}>Envios</span>
        <span style={{ textAlign: 'right' }}>Curar</span>
        <span style={{ textAlign: 'right' }}>Aprov.</span>
        <span style={{ textAlign: 'right' }}>Hires</span>
        <span style={{ textAlign: 'right' }}>Dias</span>
        <span style={{ textAlign: 'right' }}>Status</span>
      </div>

      <div className="flex flex-col divide-y divide-(--border-1)">
        {rows.map(job => (
          <Link
            key={job.id}
            href={`/hr/vagas/${job.id}`}
            style={{
              padding: '12px 22px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) auto auto auto auto auto auto',
              gap: '12px',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background .15s var(--ease)',
              background: highlightStatus === 'pending' && job.status === 'pending_hr_review'
                ? 'var(--warning-bg)'
                : undefined,
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
                {pickCompanyName(job.companies)}
                {job.seniority && ` · ${job.seniority}`}
                {job.work_model && ` · ${job.work_model}`}
              </div>
            </div>
            <KpiCell value={job.totalSubs} />
            <KpiCell value={job.pendingSubs} attention={job.pendingSubs > 0} />
            <KpiCell value={job.approvedSubs} />
            <KpiCell value={job.hires} positive={job.hires > 0} />
            <KpiCell
              value={job.pctOfDeadline !== null ? `${job.daysOpen}d · ${job.pctOfDeadline}%` : `${job.daysOpen}d`}
              attention={job.pctOfDeadline !== null && job.pctOfDeadline >= 80}
            />
            <Badge variant={getJobStatusVariant(job.status)} size="sm">
              {getJobStatusLabel(job.status)}
            </Badge>
          </Link>
        ))}
      </div>
      <style>{`.nx-job-row:hover { background: var(--bg-elev-1); }`}</style>
    </Card>
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
          ? 'var(--warning-text)'
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
