import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import MetricCard from '@/components/ui/MetricCard'
import AttentionList from '@/components/ui/AttentionList'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import WelcomeCard from '@/components/dashboard/WelcomeCard'
import { filterJobsByVisibility, type RecruiterLevel } from '@/lib/visibility'
import { formatCurrency, getSubmissionStatusLabel } from '@/lib/utils'

export const metadata = {
  title: 'Dashboard — Hunter',
}

type CompanyRel = { name: string | null }
type JobRel = { title: string | null }
type CandidateRel = { full_name: string | null }

function pickOne<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

const ACTIVE = new Set([
  'submitted', 'ai_analyzed', 'hr_approved', 'sent_to_client',
  'client_approved', 'interview_scheduled', 'offer',
])

export default async function HunterDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: userData } = await admin
    .from('users').select('full_name').eq('id', user.id).single()

  const { data: recruiter } = await admin
    .from('recruiters').select('*').eq('user_id', user.id).maybeSingle()

  const { data: submissions } = await admin
    .from('submissions')
    .select('id, status, submitted_at, ai_score, candidates(full_name), jobs(title, companies(name))')
    .eq('recruiter_id', recruiter?.id || '')
    .order('submitted_at', { ascending: false })

  const hunterLevel: RecruiterLevel | null =
    recruiter?.status === 'approved' ? ((recruiter?.level as RecruiterLevel) || 'beginner') : null

  const { data: allOpenJobs } = await admin
    .from('jobs')
    .select('id, title, location, salary_min, visibility_type, companies(name)')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })
    .limit(20)

  const openJobs = filterJobsByVisibility(allOpenJobs, hunterLevel).slice(0, 5)

  // Stats em tempo real
  const subs = submissions ?? []
  const ativos = subs.filter(s => ACTIVE.has(s.status))
  const aprovadosHR = subs.filter(s =>
    ['hr_approved', 'sent_to_client', 'client_approved', 'interview_scheduled', 'offer', 'hired', 'not_hired'].includes(s.status),
  )
  const contratacoes = subs.filter(s => s.status === 'hired')
  const reprovadosHR = subs.filter(s => s.status === 'hr_rejected').length

  // Taxas
  const terminalCount = subs.filter(s =>
    ['hr_approved', 'hr_rejected', 'sent_to_client', 'client_approved', 'client_rejected', 'interview_scheduled', 'offer', 'hired', 'not_hired', 'duplicate'].includes(s.status),
  ).length
  const hrRate = terminalCount > 0 ? Math.round((aprovadosHR.length / terminalCount) * 100) : 0
  const hireRate = subs.length > 0 ? Math.round((contratacoes.length / subs.length) * 100) : 0

  // Nível e progresso
  const levelLabels: Record<string, string> = {
    beginner: 'Iniciante',
    specialist: 'Especialista',
    top_hunter: 'Top Hunter',
  }
  const levelLabel = levelLabels[recruiter?.level || 'beginner'] ?? 'Iniciante'

  // Atenção
  const attention: { title: string; context?: string; count?: number; tone: 'attention' | 'positive' | 'neutral'; href: string; cta?: string }[] = []

  if (!recruiter || recruiter.status !== 'approved') {
    attention.push({
      title: 'Perfil em análise',
      context: 'Seu cadastro está sendo avaliado. Você verá vagas mas só envia após aprovação.',
      tone: 'attention',
      href: '/hunter/vagas',
      cta: 'Ver vagas →',
    })
  }

  const interviewing = subs.filter(s => s.status === 'interview_scheduled').length
  if (interviewing > 0) {
    attention.push({
      title: 'Candidatos em entrevista',
      context: 'Acompanhe o status no painel.',
      count: interviewing,
      tone: 'positive',
      href: '/hunter/submissoes',
    })
  }

  const newOpen = openJobs.length
  if (newOpen > 0 && recruiter?.status === 'approved') {
    attention.push({
      title: `${newOpen} vaga${newOpen === 1 ? '' : 's'} disponíve${newOpen === 1 ? 'l' : 'is'}`,
      context: 'Veja e envie candidatos antes que os slots fechem.',
      tone: 'neutral',
      href: '/hunter/vagas',
    })
  }

  const firstName = userData?.full_name?.split(' ')[0] || 'hunter'

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Painel"
        title="Olá,"
        titleAccent={firstName}
        subtitle={recruiter?.status === 'approved' ? `Nível ${levelLabel} · ${subs.length} envio${subs.length === 1 ? '' : 's'} no total` : 'Seu painel de oportunidades e performance.'}
      />

      <WelcomeCard role="recruiter" userId={user.id} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Envios ativos"
          value={ativos.length}
          footer={`${subs.length} no total · ${reprovadosHR} reprovados`}
        />
        <MetricCard
          label="Aprovação HR"
          value={`${hrRate}%`}
          footer={terminalCount > 0 ? `${aprovadosHR.length}/${terminalCount} terminais` : 'sem envios decididos'}
        />
        <MetricCard
          label="Taxa de contratação"
          value={`${hireRate}%`}
          footer={`${contratacoes.length} contratado${contratacoes.length === 1 ? '' : 's'}`}
        />
        <MetricCard
          label="Vagas disponíveis"
          value={openJobs.length}
          footer={`Nível ${levelLabel}`}
        />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 mb-5">
        <AttentionList
          title="O que precisa de atenção"
          items={attention}
          emptyMessage="Tudo em ordem. Confira vagas abertas pra enviar mais candidatos."
        />

        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)' }}>
              Últimos envios
            </h2>
            <Link href="/hunter/submissoes" style={{ fontSize: '11.5px', color: 'var(--accent-text)' }}>
              Ver todos
            </Link>
          </div>
          {subs.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-4)', textAlign: 'center', padding: '14px 0' }}>
              Você ainda não enviou candidatos.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {subs.slice(0, 5).map(sub => {
                const candidate = pickOne(sub.candidates as CandidateRel | CandidateRel[] | null | undefined)
                const job = pickOne(sub.jobs as (JobRel & { companies: CompanyRel | CompanyRel[] | null }) | (JobRel & { companies: CompanyRel | CompanyRel[] | null })[] | null | undefined)
                return (
                  <div
                    key={sub.id}
                    style={{
                      padding: '10px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-1)' }}>
                        {candidate?.full_name || 'Candidato'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>
                        {job?.title}
                      </div>
                    </div>
                    {sub.ai_score && (
                      <span
                        className="mono"
                        style={{ fontSize: '10.5px', color: 'var(--text-4)' }}
                      >
                        {sub.ai_score}
                      </span>
                    )}
                    <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
                      {getSubmissionStatusLabel(sub.status)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)' }}>
            Vagas disponíveis pra você
          </h2>
          <Link href="/hunter/vagas" style={{ fontSize: '11.5px', color: 'var(--accent-text)' }}>
            Ver todas
          </Link>
        </div>
        {openJobs.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-4)', textAlign: 'center', padding: '14px 0' }}>
            Nenhuma vaga disponível pro seu nível agora.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-(--border-1)">
            {openJobs.map(job => {
              const company = pickOne(job.companies as CompanyRel | CompanyRel[] | null | undefined)
              const isExclusive = job.visibility_type && job.visibility_type !== 'open'
              return (
                <Link
                  key={job.id}
                  href={`/hunter/vagas/${job.id}`}
                  style={{
                    padding: '12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>
                        {job.title}
                      </span>
                      {isExclusive && (
                        <Badge variant={job.visibility_type === 'top_hunters_only' ? 'dark' : 'blue'} size="sm">
                          {job.visibility_type === 'top_hunters_only' ? 'Top Hunters' : 'Especialistas+'}
                        </Badge>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>
                      {company?.name}
                      {job.location && ` · ${job.location}`}
                    </div>
                  </div>
                  {job.salary_min && (
                    <span
                      className="mono"
                      style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--accent-text)' }}
                    >
                      {formatCurrency(job.salary_min)}+
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
