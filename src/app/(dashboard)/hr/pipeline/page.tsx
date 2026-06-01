import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import KanbanBoard, { type KanbanSubmission } from '@/components/submissions/KanbanBoard'
import KanbanFilters, { type KanbanFilterJob } from '@/components/submissions/KanbanFilters'
import type { SubmissionStatus } from '@/types/database'

export const metadata = {
  title: 'Pipeline — Nexhire HR',
}

const ACTIVE_STATUSES: SubmissionStatus[] = [
  'submitted',
  'ai_analyzed',
  'hr_approved',
  'sent_to_client',
  'client_approved',
  'interview_scheduled',
  'hired',
]

interface RawSubmission {
  id: string
  status: SubmissionStatus
  submitted_at: string
  ai_score: number | null
  candidates: { full_name: string; current_title: string | null } | null
  jobs: { id: string; title: string; seniority: string | null; companies: { name: string | null } | null } | null
  recruiters: { users: { full_name: string | null } | null } | null
}

export default async function HRPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ vaga?: string }>
}) {
  const params = await searchParams
  const selectedJobId = params.vaga ?? null

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

  const baseQuery = admin
    .from('submissions')
    .select('id, status, submitted_at, ai_score, candidates(full_name, current_title), jobs(id, title, seniority, companies(name)), recruiters(users(full_name))')
    .in('status', ACTIVE_STATUSES)
    .order('submitted_at', { ascending: false })

  const { data: rawSubs } = selectedJobId
    ? await baseQuery.eq('job_id', selectedJobId).returns<RawSubmission[]>()
    : await baseQuery.returns<RawSubmission[]>()

  const submissions: KanbanSubmission[] = (rawSubs ?? []).map(s => ({
    id: s.id,
    status: s.status,
    candidateName: s.candidates?.full_name ?? 'Candidato sem nome',
    candidateTitle: s.candidates?.current_title ?? null,
    hunterName: s.recruiters?.users?.full_name ?? null,
    jobTitle: s.jobs?.title ?? null,
    aiScore: s.ai_score,
    submittedAt: s.submitted_at,
  }))

  // Pra montar lista de filtros, sempre busca tudo (sem filtro de job)
  const { data: jobsWithSubs } = selectedJobId
    ? await admin
        .from('submissions')
        .select('jobs(id, title, seniority, companies(name))')
        .in('status', ACTIVE_STATUSES)
        .returns<{ jobs: RawSubmission['jobs'] }[]>()
    : { data: rawSubs?.map(s => ({ jobs: s.jobs })) ?? [] }

  const jobMap = new Map<string, KanbanFilterJob>()
  let totalCount = 0
  for (const row of jobsWithSubs ?? []) {
    totalCount++
    const job = row.jobs
    if (!job) continue
    const existing = jobMap.get(job.id)
    if (existing) {
      existing.count++
    } else {
      jobMap.set(job.id, {
        id: job.id,
        title: job.title,
        companyName: job.companies?.name ?? null,
        seniority: job.seniority ?? null,
        count: 1,
      })
    }
  }
  const filterJobs = Array.from(jobMap.values()).sort((a, b) => b.count - a.count)

  const selectedJob = selectedJobId ? jobMap.get(selectedJobId) : null

  return (
    <div className="max-w-7xl">
      <PageHeader
        eyebrow="Operação"
        title="Pipeline"
        titleAccent={selectedJob ? selectedJob.title : 'global'}
        subtitle={
          selectedJob
            ? `${submissions.length} candidato${submissions.length !== 1 ? 's' : ''} ativos nesta vaga${selectedJob.companyName ? ` · ${selectedJob.companyName}` : ''}`
            : `${submissions.length} candidato${submissions.length !== 1 ? 's' : ''} ativos em todas as vagas`
        }
      />

      <KanbanFilters
        jobs={filterJobs}
        selectedJobId={selectedJobId}
        totalCount={totalCount}
      />

      <KanbanBoard submissions={submissions} showJob={!selectedJobId} />
    </div>
  )
}
