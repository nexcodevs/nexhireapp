import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import JobFilters from '@/components/jobs/JobFilters'
import SemanticJobSearch from '@/components/jobs/SemanticJobSearch'
import CompanyAvatar from '@/components/empresa/CompanyAvatar'
import { formatDate, formatCurrency } from '@/lib/utils'
import { filterJobsByVisibility, type RecruiterLevel } from '@/lib/visibility'
import { getBlockedCompanyIds } from '@/lib/blocks'

export const metadata = {
  title: 'Vagas disponíveis — Nexhire',
}

interface PageProps {
  searchParams: Promise<{
    seniority?: string
    model?: string
    type?: string
    hideSubmitted?: string
    q?: string
    ids?: string
  }>
}

export default async function HunterVagasPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const seniorityFilter = sp.seniority?.split(',').filter(Boolean) ?? []
  const modelFilter = sp.model?.split(',').filter(Boolean) ?? []
  const typeFilter = sp.type?.split(',').filter(Boolean) ?? []
  const hideSubmitted = sp.hideSubmitted === '1'
  const semanticIds = sp.ids?.split(',').filter(Boolean) ?? []
  const semanticQuery = sp.q?.trim() ?? ''

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

  // Empresas que bloquearam esse hunter — não devem aparecer na lista
  const blockedCompanyIds = await getBlockedCompanyIds(supabase, user.id)

  let query = supabase
    .from('jobs')
    .select('*, companies(name, logo_url)')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })

  if (seniorityFilter.length > 0) query = query.in('seniority', seniorityFilter)
  if (modelFilter.length > 0) query = query.in('work_model', modelFilter)
  if (typeFilter.length > 0) query = query.in('employment_type', typeFilter)
  if (blockedCompanyIds.length > 0)
    query = query.not('company_id', 'in', `(${blockedCompanyIds.join(',')})`)
  if (semanticIds.length > 0) query = query.in('id', semanticIds)

  const { data: allJobs } = await query

  let jobs = filterJobsByVisibility(allJobs, hunterLevel)

  // Quando vem da busca semântica, ordenar pela ordem retornada pelo match (similarity desc)
  if (semanticIds.length > 0) {
    const orderMap = new Map(semanticIds.map((id, i) => [id, i]))
    jobs = [...jobs].sort(
      (a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity),
    )
  }

  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('job_id')
    .eq('recruiter_id', recruiter?.id || '')

  const submittedJobIds = new Set(mySubmissions?.map(s => s.job_id) || [])

  if (hideSubmitted && submittedJobIds.size > 0) {
    jobs = jobs.filter(j => !submittedJobIds.has(j.id))
  }

  const totalCount = jobs?.length || 0
  const hasFilters =
    seniorityFilter.length + modelFilter.length + typeFilter.length + (hideSubmitted ? 1 : 0) > 0

  const subtitle = semanticQuery
    ? `${totalCount} vaga${totalCount !== 1 ? 's' : ''} pra "${semanticQuery}"`
    : `${totalCount} vaga${totalCount !== 1 ? 's' : ''} ${hasFilters ? 'após filtros' : 'abertas para você'}`

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Marketplace"
        title="Vagas"
        titleAccent="disponíveis"
        subtitle={subtitle}
      />

      <SemanticJobSearch />

      {(!recruiter || recruiter.status !== 'approved') && (
        <Card padding="md" className="mb-6" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }}>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning-text)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--warning-text)' }}>Perfil pendente de aprovação</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--warning-text)' }}>Você pode ver as vagas mas só poderá enviar candidatos após aprovação.</div>
            </div>
          </div>
        </Card>
      )}

      <JobFilters
        showHideSubmitted
        resultsLabel={hasFilters ? `${totalCount} resultado${totalCount !== 1 ? 's' : ''}` : undefined}
      />

      {totalCount === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p className="text-sm" style={{ color: 'var(--color-subtle)' }}>
              {hasFilters
                ? 'Nenhuma vaga corresponde aos filtros aplicados.'
                : 'Nenhuma vaga disponível pra você no momento.'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-subtle)' }}>
              {hasFilters
                ? 'Tente remover algum filtro ou limpar todos.'
                : hunterLevel === 'beginner'
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
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <CompanyAvatar
                        name={(job.companies as { name: string | null; logo_url: string | null } | null)?.name ?? null}
                        logoPath={(job.companies as { name: string | null; logo_url: string | null } | null)?.logo_url ?? null}
                        size="md"
                      />
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
                        <span className="font-medium" style={{ color: 'var(--color-muted)' }}>{(job.companies as { name: string | null } | null)?.name}</span>
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
                    </div>
                    <div className="text-right shrink-0">
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
