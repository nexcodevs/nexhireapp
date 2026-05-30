import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import KPICard from '@/components/ui/KPICard'
import InsightsCards from '@/components/dashboard/InsightsCards'
import WelcomeCard from '@/components/dashboard/WelcomeCard'
import { formatCurrency } from '@/lib/utils'

type CompanyRel = { name: string | null }
type JobRel = { title: string | null }
type CandidateRel = { full_name: string | null }

function pickOne<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}
import { filterJobsByVisibility, type RecruiterLevel } from '@/lib/visibility'

export const metadata = {
  title: 'Dashboard Hunter — Nexhire',
}

export default async function HunterDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('full_name').eq('id', user.id).single()

  const { data: recruiter } = await supabase
    .from('recruiters').select('*').eq('user_id', user.id).single()

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, status, submitted_at, ai_score, candidates(full_name), jobs(title, companies(name))')
    .eq('recruiter_id', recruiter?.id || '')
    .order('submitted_at', { ascending: false })

  const hunterLevel: RecruiterLevel | null =
    recruiter?.status === 'approved' ? ((recruiter?.level as RecruiterLevel) || 'beginner') : null

  const { data: allOpenJobs } = await supabase
    .from('jobs')
    .select('id, title, location, work_model, salary_min, salary_max, visibility_type, companies(name)')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })

  const openJobs = filterJobsByVisibility(allOpenJobs, hunterLevel).slice(0, 3)

  const { data: score } = await supabase
    .from('recruiter_scores')
    .select('*')
    .eq('recruiter_id', recruiter?.id || '')
    .single()

  const { data: networkAvg } = await supabase
    .from('recruiter_scores')
    .select('hr_approval_rate, client_approval_rate, hire_rate, overall_score')
    .gt('total_submissions', 0)

  const avgHrRate = networkAvg && networkAvg.length > 0
    ? networkAvg.reduce((acc, r) => acc + Number(r.hr_approval_rate || 0), 0) / networkAvg.length
    : 0
  const avgClientRate = networkAvg && networkAvg.length > 0
    ? networkAvg.reduce((acc, r) => acc + Number(r.client_approval_rate || 0), 0) / networkAvg.length
    : 0

  const stats = {
    enviados: submissions?.length || 0,
    aprovados_hr: submissions?.filter(s => ['hr_approved', 'sent_to_client', 'client_approved', 'interview_scheduled', 'hired'].includes(s.status)).length || 0,
    contratacoes: submissions?.filter(s => s.status === 'hired').length || 0,
    vagas_disponiveis: openJobs?.length || 0,
  }

  const levelLabels: Record<string, string> = {
    beginner: 'Iniciante',
    specialist: 'Especialista',
    top_hunter: 'Top Hunter',
  }
  const levelLabel = levelLabels[score?.level || 'beginner'] ?? 'Iniciante'

  // Usa contagem em tempo real (submissions diretas) em vez de recruiter_scores
  // (cache) — recruiter_scores pode estar stale entre triggers/recomputes.
  const totalSubs = stats.enviados
  const overall = Number(score?.overall_score || 0)
  const totalHires = stats.contratacoes

  let nextLevelLabel = ''
  let progressPercent = 0
  let progressDescription = ''

  if (score?.level === 'beginner') {
    nextLevelLabel = 'Especialista'
    const subsProgress = Math.min(100, (totalSubs / 10) * 100)
    const scoreProgress = Math.min(100, (overall / 60) * 100)
    progressPercent = Math.round((subsProgress + scoreProgress) / 2)
    const subsMissing = Math.max(0, 10 - totalSubs)
    const scoreMissing = Math.max(0, 60 - overall)
    if (subsMissing > 0 && scoreMissing > 0) {
      progressDescription = `Faltam ${subsMissing} envios e melhorar score em ${scoreMissing.toFixed(0)} pts`
    } else if (subsMissing > 0) {
      progressDescription = `Faltam ${subsMissing} envios pra subir de nível`
    } else if (scoreMissing > 0) {
      progressDescription = `Score ${scoreMissing.toFixed(0)} pts abaixo da meta`
    }
  } else if (score?.level === 'specialist') {
    nextLevelLabel = 'Top Hunter'
    const subsProgress = Math.min(100, (totalSubs / 30) * 100)
    const scoreProgress = Math.min(100, (overall / 80) * 100)
    const hiresProgress = Math.min(100, (totalHires / 5) * 100)
    progressPercent = Math.round((subsProgress + scoreProgress + hiresProgress) / 3)
    const subsMissing = Math.max(0, 30 - totalSubs)
    const hiresMissing = Math.max(0, 5 - totalHires)
    const parts = []
    if (subsMissing > 0) parts.push(`${subsMissing} envios`)
    if (hiresMissing > 0) parts.push(`${hiresMissing} contratações`)
    if (overall < 80) parts.push(`score ${(80 - overall).toFixed(0)} pts acima`)
    progressDescription = parts.length > 0 ? `Faltam ${parts.join(', ')}` : 'Quase lá'
  } else {
    nextLevelLabel = ''
    progressPercent = 100
    progressDescription = 'Você está no nível máximo'
  }

  const compareToNetwork = (mine: number, network: number) => {
    if (network === 0) return { label: 'Sem comparativo ainda', color: 'gray' as const }
    const diff = mine - network
    if (diff >= 10) return { label: 'Muito acima da média', color: 'green' as const }
    if (diff >= 0) return { label: 'Acima da média', color: 'green' as const }
    if (diff >= -10) return { label: 'Na média', color: 'gray' as const }
    return { label: 'Abaixo da média', color: 'yellow' as const }
  }

  // Taxas em tempo real (evita cache stale do recruiter_scores)
  const subs = submissions ?? []
  const terminalDecisions = subs.filter(s => [
    'hr_approved','sent_to_client','client_approved','client_rejected',
    'interview_scheduled','offer','hired','hr_rejected','duplicate','not_hired',
  ].includes(s.status)).length
  const hrApprovedCount = subs.filter(s => [
    'hr_approved','sent_to_client','client_approved','client_rejected',
    'interview_scheduled','offer','hired','not_hired',
  ].includes(s.status)).length
  const clientApprovedCount = subs.filter(s => [
    'client_approved','interview_scheduled','offer','hired',
  ].includes(s.status)).length

  const hrRate = terminalDecisions > 0 ? Math.round((hrApprovedCount / terminalDecisions) * 100) : 0
  const clientRate = hrApprovedCount > 0 ? Math.round((clientApprovedCount / hrApprovedCount) * 100) : 0
  const hrCompare = compareToNetwork(hrRate, avgHrRate)
  const clientCompare = compareToNetwork(clientRate, avgClientRate)

  return (
    <div className="max-w-5xl">
  <PageHeader
        eyebrow="Hunter Dashboard"
        title="Olá,"
        titleAccent={userData?.full_name?.split(' ')[0] || 'hunter'}
        subtitle="Seu painel de oportunidades, performance e submissões."
      />

      <WelcomeCard role="recruiter" userId={user.id} />
      <InsightsCards role="recruiter" />

      {(!recruiter || recruiter.status !== 'approved') && (
        <Card padding="md" className="mb-6" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }}>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" style={{ color: 'var(--warning-text)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--warning-text)' }}>Perfil em análise</div>
              <div className="text-xs" style={{ color: 'var(--warning-text)' }}>Seu cadastro está sendo avaliado pelo time Nexhire. Você será notificado quando aprovado.</div>
            </div>
          </div>
        </Card>
      )}

      {recruiter?.status === 'approved' && (
        <Card padding="md" className="mb-6" style={{ borderColor: 'var(--accent-border)', background: 'linear-gradient(to bottom right, var(--accent-bg), var(--bg-elev-1))' }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--accent-text)' }}>Sua performance</div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{levelLabel}</h2>
                <span className="text-sm" style={{ color: 'var(--text-3)' }}>score {overall.toFixed(0)}</span>
              </div>
            </div>
            {nextLevelLabel && (
              <div className="text-right">
                <div className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Próximo nível</div>
                <Badge variant="dark">{nextLevelLabel}</Badge>
              </div>
            )}
          </div>

          {nextLevelLabel && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs" style={{ color: 'var(--text-3)' }}>{progressDescription}</div>
                <div className="text-xs font-bold" style={{ color: 'var(--accent-text)' }}>{progressPercent}%</div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-2)' }}>
                <div className="h-full transition-all" style={{ width: `${progressPercent}%`, background: 'var(--accent-text)' }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-4 border-t" style={{ borderColor: 'var(--accent-border)' }}>
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Envios totais</div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{totalSubs}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Aprovação HR</div>
              <Badge variant={hrCompare.color}>{hrCompare.label}</Badge>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Aprovação cliente</div>
              <Badge variant={clientCompare.color}>{clientCompare.label}</Badge>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard label="Candidatos enviados" value={stats.enviados} />
        <KPICard label="Aprovados pelo HR" value={stats.aprovados_hr} />
        <KPICard label="Contratações" value={stats.contratacoes} />
        <KPICard label="Vagas disponíveis" value={stats.vagas_disponiveis} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Vagas disponíveis</h2>
            <Link href="/hunter/vagas" className="text-sm hover:underline" style={{ color: 'var(--accent-text)' }}>Ver todas</Link>
          </div>
          {!openJobs || openJobs.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-4)' }}>Nenhuma vaga disponível no momento.</p>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {openJobs.map(job => {
                const company = pickOne(job.companies as CompanyRel | CompanyRel[] | null | undefined)
                return (
                <Link key={job.id} href={`/hunter/vagas/${job.id}`} className="py-3 flex items-center justify-between -mx-2 px-2 rounded transition-colors hover:bg-(--bg-elev-2)">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{job.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-4)' }}>
                      {company?.name}
                      {job.location && ` · ${job.location}`}
                    </div>
                  </div>
                  {job.salary_min && (
                    <div className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
                      {formatCurrency(job.salary_min)}+
                    </div>
                  )}
                </Link>
                )
              })}
            </div>
          )}
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Minhas submissões</h2>
            <Link href="/hunter/submissoes" className="text-sm hover:underline" style={{ color: 'var(--accent-text)' }}>Ver todas</Link>
          </div>
          {!submissions || submissions.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-4)' }}>Nenhuma submissão ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {submissions.slice(0, 5).map(sub => {
                const candidate = pickOne(sub.candidates as CandidateRel | CandidateRel[] | null | undefined)
                const subJob = pickOne(sub.jobs as JobRel | JobRel[] | null | undefined)
                return (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                      {candidate?.full_name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-4)' }}>{subJob?.title}</div>
                  </div>
                  <div className="flex items-center gap-3">
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
                    <Badge variant={
                      sub.status === 'submitted' ? 'gray' :
                      sub.status === 'hr_approved' ? 'green' :
                      sub.status === 'hr_rejected' ? 'red' :
                      sub.status === 'hired' ? 'dark' : 'gray'
                    }>
                      {sub.status === 'submitted' && 'Enviado'}
                      {sub.status === 'ai_analyzed' && 'Analisado'}
                      {sub.status === 'hr_approved' && 'Aprovado'}
                      {sub.status === 'hr_rejected' && 'Reprovado'}
                      {sub.status === 'sent_to_client' && 'Com cliente'}
                      {sub.status === 'client_approved' && 'Cliente aprovou'}
                      {sub.status === 'client_rejected' && 'Cliente reprovou'}
                      {sub.status === 'interview_scheduled' && 'Entrevista'}
                      {sub.status === 'hired' && 'Contratado'}
                      {!['submitted','ai_analyzed','hr_approved','hr_rejected','sent_to_client','client_approved','client_rejected','interview_scheduled','hired'].includes(sub.status) && sub.status}
                    </Badge>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}