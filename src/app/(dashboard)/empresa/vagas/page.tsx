import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import JobFilters from '@/components/jobs/JobFilters'
import { formatDate, formatCurrency } from '@/lib/utils'
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
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (statusFilter.length > 0) query = query.in('status', statusFilter)
  if (seniorityFilter.length > 0) query = query.in('seniority', seniorityFilter)
  if (modelFilter.length > 0) query = query.in('work_model', modelFilter)
  if (typeFilter.length > 0) query = query.in('employment_type', typeFilter)

  const { data: jobs } = await query
  const hasFilters =
    statusFilter.length + seniorityFilter.length + modelFilter.length + typeFilter.length > 0

  // Conta submissions visíveis pra empresa por vaga
  const jobIds = (jobs ?? []).map(j => j.id)
  const VISIBLE_TO_EMPRESA: string[] = [
    'sent_to_client',
    'client_approved',
    'client_rejected',
    'interview_scheduled',
    'offer',
    'hired',
    'not_hired',
  ]
  const { data: visibleSubs } = jobIds.length
    ? await supabase
        .from('submissions')
        .select('job_id, status')
        .in('job_id', jobIds)
        .in('status', VISIBLE_TO_EMPRESA)
    : { data: [] as { job_id: string; status: string }[] }

  const candidateStats = new Map<string, { total: number; aguardando: number }>()
  for (const sub of visibleSubs ?? []) {
    const cur = candidateStats.get(sub.job_id) ?? { total: 0, aguardando: 0 }
    cur.total++
    if (sub.status === 'sent_to_client') cur.aguardando++
    candidateStats.set(sub.job_id, cur)
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Gestão"
        title="Minhas"
        titleAccent="vagas"
        subtitle={`${jobs?.length || 0} vaga${jobs?.length !== 1 ? 's' : ''} ${hasFilters ? 'após filtros' : 'no total'}`}
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
        resultsLabel={hasFilters ? `${jobs?.length || 0} resultado${jobs?.length !== 1 ? 's' : ''}` : undefined}
      />

      {!jobs || jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-12">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--color-m100)' }}
            >
              <svg className="w-6 h-6" style={{ color: 'var(--color-g600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--color-text)', fontWeight: 500 }}>
              {hasFilters ? 'Nenhuma vaga corresponde aos filtros' : 'Você ainda não tem vagas'}
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--color-subtle)' }}>
              {hasFilters
                ? 'Tente remover algum filtro ou limpar todos.'
                : 'Crie sua primeira vaga e receba candidatos curados em poucos dias.'}
            </p>
            {!hasFilters && (
              <Link href="/empresa/vagas/nova">
                <Button variant="dark" size="md">Criar primeira vaga</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => {
            const status = statusLabel[job.status] || { label: job.status, variant: 'gray' as const }
            const stats = candidateStats.get(job.id) ?? { total: 0, aguardando: 0 }
            return (
              <Link key={job.id} href={`/empresa/vagas/${job.id}/candidatos`} className="block">
                <Card padding="md" hover className="cursor-pointer">
                  <div className="flex items-stretch gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-base font-bold truncate" style={{ color: 'var(--color-text)' }}>
                          {job.title}
                        </h2>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--color-subtle)' }}>
                        {job.seniority && <span>{job.seniority}</span>}
                        {job.location && <span>· {job.location}</span>}
                        {job.work_model && <span>· {job.work_model}</span>}
                        {job.employment_type && <span>· {job.employment_type}</span>}
                      </div>
                      {job.salary_min && (
                        <div className="text-xs mt-2 mono" style={{ color: 'var(--color-muted)' }}>
                          {formatCurrency(job.salary_min)}
                          {job.salary_max && ` — ${formatCurrency(job.salary_max)}`}
                          {' · '}
                          <span style={{ color: 'var(--color-subtle)' }}>
                            Criada em {formatDate(job.created_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className="flex-shrink-0 flex flex-col items-end justify-center"
                      style={{
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md)',
                        background:
                          stats.aguardando > 0
                            ? 'var(--color-m100)'
                            : 'var(--color-cream)',
                        border:
                          stats.aguardando > 0
                            ? '1px solid var(--color-border-g)'
                            : '1px solid var(--color-border)',
                        minWidth: '120px',
                        textAlign: 'right',
                      }}
                    >
                      <span
                        className="it"
                        style={{
                          fontSize: '26px',
                          color:
                            stats.total > 0
                              ? 'var(--color-g600)'
                              : 'var(--color-subtle)',
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {stats.total}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'var(--color-subtle)',
                          marginTop: '4px',
                        }}
                      >
                        {stats.total === 1 ? 'Candidato' : 'Candidatos'}
                      </span>
                      {stats.aguardando > 0 && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 500,
                            color: 'var(--color-g600)',
                            marginTop: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: 'var(--color-neon)',
                            }}
                          />
                          {stats.aguardando} esperando você
                        </span>
                      )}
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
