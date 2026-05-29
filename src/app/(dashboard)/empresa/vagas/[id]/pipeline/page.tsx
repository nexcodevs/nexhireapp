import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import KanbanBoard, { type KanbanSubmission } from '@/components/submissions/KanbanBoard'
import type { SubmissionStatus } from '@/types/database'

export const metadata = {
  title: 'Pipeline da vaga — Nexhire',
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
  recruiters: { users: { full_name: string | null } | null } | null
}

export default async function EmpresaVagaPipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!companyUser?.company_id) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, status, companies(name)')
    .eq('id', id)
    .eq('company_id', companyUser.company_id)
    .single<{ id: string; title: string; status: string; companies: { name: string | null } | null }>()

  if (!job) notFound()

  const { data: rawSubs } = await supabase
    .from('submissions')
    .select('id, status, submitted_at, ai_score, candidates(full_name, current_title), recruiters(users(full_name))')
    .eq('job_id', id)
    .in('status', ACTIVE_STATUSES)
    .order('submitted_at', { ascending: false })
    .returns<RawSubmission[]>()

  const submissions: KanbanSubmission[] = (rawSubs ?? []).map(s => ({
    id: s.id,
    status: s.status,
    candidateName: s.candidates?.full_name ?? 'Candidato sem nome',
    candidateTitle: s.candidates?.current_title ?? null,
    hunterName: s.recruiters?.users?.full_name ?? null,
    jobTitle: null,
    aiScore: s.ai_score,
    submittedAt: s.submitted_at,
  }))

  return (
    <div className="max-w-7xl">
      <Link
        href={`/empresa/vagas/${id}/candidatos`}
        style={{
          fontSize: '13px',
          color: 'var(--color-muted)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '20px',
        }}
        className="hover:underline"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para candidatos
      </Link>

      <PageHeader
        eyebrow="Pipeline da vaga"
        title={job.title}
        titleAccent="pipeline"
        subtitle={`${submissions.length} candidato${submissions.length !== 1 ? 's' : ''} ativos · ${job.companies?.name ?? ''}`}
      />

      <KanbanBoard submissions={submissions} showJob={false} />
    </div>
  )
}
