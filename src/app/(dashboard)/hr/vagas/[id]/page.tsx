import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import HRJobActions from '@/components/jobs/HRJobActions'
import JobDetailView, { type JobDetailData } from '@/components/jobs/JobDetailView'
import { getJobStatusLabel, getJobStatusVariant, formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Vaga — HR Manager',
}

type CompanyRel = { name: string | null }
type CandidateRel = { full_name: string | null; current_title: string | null; location: string | null }
type UserRel = { full_name: string | null }
type RecruiterRel = { users: UserRel | UserRel[] | null }

function pickOne<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

export default async function HRVagaDetailPage({
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
    .select('*, companies(name)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, status, ai_score, submitted_at, candidates(full_name, current_title, location), recruiters(users(full_name))')
    .eq('job_id', id)
    .order('submitted_at', { ascending: false })

  const jobCompany = pickOne(job.companies as CompanyRel | CompanyRel[] | null | undefined)
  const submissionsCount = submissions?.length ?? 0

  return (
    <div className="max-w-5xl">
      <Link
        href="/hr/vagas"
        style={{
          fontSize: '13px',
          color: 'var(--text-3)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '20px',
        }}
        className="hover:underline"
      >
        ← Voltar para vagas
      </Link>

      <div className="flex items-start justify-between gap-4 mb-2">
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 500,
                color: 'var(--text-1)',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
              }}
            >
              {job.title}
            </h1>
            <Badge variant={getJobStatusVariant(job.status)}>
              {getJobStatusLabel(job.status)}
            </Badge>
          </div>
          <div
            style={{ fontSize: '13px', color: 'var(--text-3)' }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span style={{ fontWeight: 500 }}>{jobCompany?.name}</span>
            <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-4)' }}>
              Criada em {formatDate(job.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Ações do HR (quando pendente revisão) */}
      {job.status === 'pending_hr_review' && (
        <div className="mb-4 mt-4">
          <HRJobActions jobId={job.id} />
        </div>
      )}

      {/* Vaga estruturada */}
      <div className="mt-5 mb-5">
        <JobDetailView
          job={job as JobDetailData}
          showInterviewQuestions={true}
          showRecruiterRules={true}
        />
      </div>

      {/* Submissões */}
      <Card padding="none">
        <div
          style={{
            padding: '14px 22px',
            borderBottom: submissionsCount > 0 ? '1px solid var(--border-1)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
            Submissões ({submissionsCount})
          </h2>
          {submissionsCount > 0 && (
            <Link
              href={`/hr/vagas/${job.id}/shortlist`}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent-text)',
                background: 'var(--accent-bg)',
                border: '1px solid var(--accent-border)',
                padding: '5px 10px',
                borderRadius: 'var(--r-sm)',
                textDecoration: 'none',
              }}
            >
              Shortlist IA →
            </Link>
          )}
        </div>
        {submissionsCount === 0 ? (
          <p style={{ fontSize: '12.5px', color: 'var(--text-4)', textAlign: 'center', padding: '20px' }}>
            Nenhuma submissão ainda.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-(--border-1)">
            {submissions?.map(sub => {
              const candidate = pickOne(sub.candidates as CandidateRel | CandidateRel[] | null | undefined)
              const recruiterRaw = pickOne(sub.recruiters as RecruiterRel | RecruiterRel[] | null | undefined)
              const recruiterUser = recruiterRaw ? pickOne(recruiterRaw.users) : null
              return (
                <Link
                  key={sub.id}
                  href={`/hr/submissoes/${sub.id}`}
                  style={{
                    padding: '12px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>
                        {candidate?.full_name}
                      </span>
                      {sub.ai_score && (
                        <span
                          className="mono"
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--accent-text)',
                            background: 'var(--accent-bg)',
                            padding: '1px 6px',
                            borderRadius: 'var(--r-sm)',
                          }}
                        >
                          {sub.ai_score}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-4)' }}>
                      {candidate?.current_title}
                      {recruiterUser?.full_name && ` · ${recruiterUser.full_name}`}
                    </div>
                  </div>
                  <Badge
                    variant={
                      sub.status === 'hr_approved' ? 'green' :
                      sub.status === 'hr_rejected' ? 'red' :
                      sub.status === 'hired' ? 'dark' :
                      sub.status === 'submitted' ? 'yellow' : 'gray'
                    }
                    size="sm"
                  >
                    {sub.status}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
