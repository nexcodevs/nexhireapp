import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import { formatDate, formatCurrency } from '@/lib/utils'
import { filterJobsByVisibility, type RecruiterLevel } from '@/lib/visibility'

export const metadata = {
  title: 'Vagas disponíveis — Nexhire',
}

export default async function HunterVagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const hunterLevel: RecruiterLevel | null =
    recruiter?.status === 'approved' ? ((recruiter?.level as RecruiterLevel) || 'beginner') : null

  const { data: allJobs } = await supabase
    .from('jobs')
    .select('*, companies(name)')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })

  const jobs = filterJobsByVisibility(allJobs, hunterLevel)

  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('job_id')
    .eq('recruiter_id', recruiter?.id || '')

  const submittedJobIds = new Set(mySubmissions?.map(s => s.job_id) || [])

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Marketplace"
        title="Vagas"
        titleAccent="disponíveis"
        subtitle={`${jobs?.length || 0} vaga${jobs?.length !== 1 ? 's' : ''} abertas para você`}
      />

      {(!recruiter || recruiter.status !== 'approved') && (
        <Card padding="md" className="mb-6" style={{ background: '#FFFBEB', borderColor: '#FEF3C7' }}>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-sm font-medium" style={{ color: '#92400E' }}>Perfil pendente de aprovação</div>
              <div className="text-xs mt-0.5" style={{ color: '#B45309' }}>Você pode ver as vagas mas só poderá enviar candidatos após aprovação.</div>
            </div>
          </div>
        </Card>
      )}

      {!jobs || jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p className="text-sm" style={{ color: 'var(--color-subtle)' }}>Nenhuma vaga disponível pra você no momento.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-subtle)' }}>
              {hunterLevel === 'beginner'
                ? 'Algumas vagas são exclusivas para níveis mais altos. Continue enviando candidatos para subir de nível.'
                : 'Volte em breve para novas oportunidades.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => {
            const alreadySubmitted = submittedJobIds.has(job.id)
            const isExclusive = job.visibility_type && job.visibility_type !== 'open'
            return (
              <Link key={job.id} href={`/hunter/vagas/${job.id}`} className="block">
                <Card padding="md" hover className="cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-base font-bold truncate" style={{ color: 'var(--color-text)' }}>{job.title}</h2>
                        {alreadySubmitted && <Badge variant="green">Candidato enviado</Badge>}
                        {isExclusive && job.visibility_type === 'top_hunters_only' && (
                          <Badge variant="dark">Exclusiva Top Hunters</Badge>
                        )}
                        {isExclusive && job.visibility_type === 'specialist_plus' && (
                          <Badge variant="blue">Especialistas+</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs mb-2 flex-wrap" style={{ color: 'var(--color-subtle)' }}>
                        <span className="font-medium" style={{ color: 'var(--color-muted)' }}>{(job.companies as any)?.name}</span>
                        {job.seniority && <span>· {job.seniority}</span>}
                        {job.location && <span>· {job.location}</span>}
                        {job.work_model && <span>· {job.work_model}</span>}
                        {job.employment_type && <span>· {job.employment_type}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        {job.submission_deadline && (
                          <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>Prazo: {formatDate(job.submission_deadline)}</span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>Limite: {job.max_submissions_per_recruiter} candidatos</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {job.salary_min && (
                        <div className="text-sm font-medium mono" style={{ color: 'var(--color-g600)' }}>
                          {formatCurrency(job.salary_min)}
                          {job.salary_max && ` — ${formatCurrency(job.salary_max)}`}
                        </div>
                      )}
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-subtle)' }}>{formatDate(job.created_at)}</div>
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
