import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import KPICard from '@/components/ui/KPICard'
import { formatDate } from '@/lib/utils'
import { requireCompany } from '@/lib/company'

export const metadata = {
  title: 'Dashboard — Nexhire',
}

export default async function EmpresaDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!['company_user', 'admin'].includes(userData?.role || '')) {
    redirect('/login')
  }

  const companyId = await requireCompany(supabase, user.id)

  const { data: companyRow } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const companyName = companyRow?.name ?? null

  // Stats de vagas e submissões da empresa
  const [
    { count: totalJobs },
    { count: openJobs },
    { count: jobsInCuration },
    { count: jobsSentToClient },
  ] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'open_for_hunters'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'in_hr_curation'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'sent_to_client'),
  ])

  // Submissões que chegaram pra empresa
  const { data: companyJobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('company_id', companyId)

  const jobIds = companyJobs?.map(j => j.id) || []

  const [
    { count: pendingForCompany },
    { count: approvedByCompany },
    { count: hiredCount },
  ] = jobIds.length > 0
    ? await Promise.all([
        supabase.from('submissions').select('*', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'sent_to_client'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'client_approved'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'hired'),
      ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }]

  // Vagas recentes
  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('id, title, status, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Candidatos pendentes pra empresa avaliar
  const { data: pendingCandidates } = jobIds.length > 0
    ? await supabase
        .from('submissions')
        .select('id, ai_score, submitted_at, candidates(full_name, current_title), jobs(title)')
        .in('job_id', jobIds)
        .eq('status', 'sent_to_client')
        .order('submitted_at', { ascending: false })
        .limit(5)
    : { data: [] }

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

  const firstName = userData?.full_name?.split(' ')[0] || companyName || 'time'

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Painel da empresa"
        title="Olá,"
        titleAccent={firstName}
        subtitle={`Acompanhe vagas, candidatos curados e o andamento dos processos da ${companyName || 'sua empresa'}.`}
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

      {/* Funil de candidatos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Pendentes de avaliação"
          value={pendingForCompany || 0}
          footer={(pendingForCompany || 0) > 0 ? 'Aguardando sua ação' : 'Nenhuma pendência'}
        />
        <KPICard label="Aprovados por você" value={approvedByCompany || 0} />
        <KPICard label="Em entrevista" value={0} />
        <KPICard label="Contratados" value={hiredCount || 0} />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard label="Total de vagas" value={totalJobs || 0} numSize="sm" />
        <KPICard label="Vagas abertas" value={openJobs || 0} numSize="sm" />
        <KPICard label="Em curadoria" value={jobsInCuration || 0} numSize="sm" />
        <KPICard label="Aguardando você" value={jobsSentToClient || 0} numSize="sm" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vagas recentes */}
        <Card padding="none">
          <div
            className="flex items-center justify-between"
            style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--color-border)' }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
              Vagas recentes
            </h2>
            <Link
              href="/empresa/vagas"
              style={{ fontSize: '12.5px', color: 'var(--color-g600)', fontWeight: 500 }}
            >
              Ver todas →
            </Link>
          </div>
          {!recentJobs || recentJobs.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-subtle)', marginBottom: '12px' }}>
                Você ainda não tem vagas.
              </p>
              <Link href="/empresa/vagas/nova">
                <Button variant="dark" size="sm">Criar primeira vaga</Button>
              </Link>
            </div>
          ) : (
            recentJobs.map(job => {
              const status = statusLabel[job.status] || { label: job.status, variant: 'gray' as const }
              return (
                <Link key={job.id} href={`/empresa/vagas/${job.id}/candidatos`} className="block">
                  <div
                    className="job-row-empresa"
                    style={{
                      padding: '14px 22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background .15s',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '3px' }}>
                        {job.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-subtle)' }}>
                        {formatDate(job.created_at)}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </Link>
              )
            })
          )}
        </Card>

        {/* Candidatos pendentes */}
        <Card padding="none">
          <div
            className="flex items-center justify-between"
            style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--color-border)' }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
              Candidatos pra avaliar
            </h2>
            <Link
              href="/empresa/candidatos"
              style={{ fontSize: '12.5px', color: 'var(--color-g600)', fontWeight: 500 }}
            >
              Ver todos →
            </Link>
          </div>
          {!pendingCandidates || pendingCandidates.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-subtle)' }}>
                Nenhum candidato aguardando sua avaliação no momento.
              </p>
            </div>
          ) : (
            pendingCandidates.map(sub => {
              type CandidateRel = { full_name: string | null; current_title: string | null }
              type JobRel = { title: string | null }
              const candidatesRel = sub.candidates as CandidateRel | CandidateRel[] | null | undefined
              const jobsRel = sub.jobs as JobRel | JobRel[] | null | undefined
              const candidate = Array.isArray(candidatesRel) ? candidatesRel[0] ?? null : candidatesRel ?? null
              const job = Array.isArray(jobsRel) ? jobsRel[0] ?? null : jobsRel ?? null
              return (
                <Link key={sub.id} href={`/empresa/candidatos/${sub.id}`} className="block">
                  <div
                    style={{
                      padding: '14px 22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background .15s',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '3px' }}>
                        {candidate?.full_name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-subtle)' }}>
                        {job?.title}
                      </div>
                    </div>
                    {sub.ai_score && (
                      <span
                        className="mono"
                        style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--text-4)',
                          letterSpacing: '0.02em',
                        }}
                        aria-label={`AI score ${sub.ai_score}`}
                      >
                        AI {sub.ai_score}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </Card>
      </div>

      <style>{`
        .job-row-empresa:hover, a.block > div:hover {
          background: var(--accent-bg);
        }
      `}</style>
    </div>
  )
}
