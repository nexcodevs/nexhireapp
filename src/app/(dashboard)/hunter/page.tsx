import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
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

  const levelLabel = {
    beginner: 'Iniciante',
    specialist: 'Especialista',
    top_hunter: 'Top Hunter',
  }[score?.level || 'beginner']

  const totalSubs = score?.total_submissions || 0
  const overall = Number(score?.overall_score || 0)
  const totalHires = score?.total_hires || 0

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

  const hrRate = Number(score?.hr_approval_rate || 0)
  const clientRate = Number(score?.client_approval_rate || 0)
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

      {(!recruiter || recruiter.status !== 'approved') && (
        <Card padding="md" className="mb-6 border-[#FEF3C7] bg-[#FFFBEB]">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#D97706] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-[#92400E]">Perfil em análise</div>
              <div className="text-xs text-[#B45309]">Seu cadastro está sendo avaliado pelo time Nexhire. Você será notificado quando aprovado.</div>
            </div>
          </div>
        </Card>
      )}

      {recruiter?.status === 'approved' && (
        <Card padding="md" className="mb-6 border-[#BBF7D0] bg-gradient-to-br from-[#F0FDF4] to-white">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-[#16A34A] font-medium mb-1">Sua performance</div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-bold text-[#052E16]">{levelLabel}</h2>
                <span className="text-sm text-[#6B7280]">score {overall.toFixed(0)}</span>
              </div>
            </div>
            {nextLevelLabel && (
              <div className="text-right">
                <div className="text-xs text-[#6B7280] mb-1">Próximo nível</div>
                <Badge variant="dark">{nextLevelLabel}</Badge>
              </div>
            )}
          </div>

          {nextLevelLabel && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-[#6B7280]">{progressDescription}</div>
                <div className="text-xs font-bold text-[#16A34A]">{progressPercent}%</div>
              </div>
              <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div className="h-full bg-[#16A34A] transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#BBF7D0]">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Envios totais</div>
              <div className="text-lg font-bold text-[#052E16]">{totalSubs}</div>
            </div>
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Aprovação HR</div>
              <Badge variant={hrCompare.color}>{hrCompare.label}</Badge>
            </div>
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Aprovação cliente</div>
              <Badge variant={clientCompare.color}>{clientCompare.label}</Badge>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Candidatos enviados', value: stats.enviados, color: 'text-[#052E16]' },
          { label: 'Aprovados pelo HR', value: stats.aprovados_hr, color: 'text-[#16A34A]' },
          { label: 'Contratações', value: stats.contratacoes, color: 'text-[#16A34A]' },
          { label: 'Vagas disponíveis', value: stats.vagas_disponiveis, color: 'text-[#3B82F6]' },
        ].map(stat => (
          <Card key={stat.label} padding="md">
            <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-[#6B7280]">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Vagas disponíveis</h2>
            <Link href="/hunter/vagas" className="text-sm text-[#16A34A] hover:underline">Ver todas</Link>
          </div>
          {!openJobs || openJobs.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">Nenhuma vaga disponível no momento.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {openJobs.map(job => (
                <Link key={job.id} href={`/hunter/vagas/${job.id}`} className="py-3 flex items-center justify-between hover:bg-[#F9FAFB] -mx-2 px-2 rounded transition-colors">
                  <div>
                    <div className="text-sm font-medium text-[#052E16]">{job.title}</div>
                    <div className="text-xs text-[#9CA3AF]">
                      {(job.companies as any)?.name}
                      {job.location && ` · ${job.location}`}
                    </div>
                  </div>
                  {job.salary_min && (
                    <div className="text-xs font-medium text-[#16A34A]">
                      {formatCurrency(job.salary_min)}+
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#052E16]">Minhas submissões</h2>
            <Link href="/hunter/submissoes" className="text-sm text-[#16A34A] hover:underline">Ver todas</Link>
          </div>
          {!submissions || submissions.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">Nenhuma submissão ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {submissions.slice(0, 5).map(sub => (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#052E16]">
                      {(sub.candidates as any)?.full_name}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">{(sub.jobs as any)?.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.ai_score && (
                      <span className="text-xs font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
                        {sub.ai_score}
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
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}