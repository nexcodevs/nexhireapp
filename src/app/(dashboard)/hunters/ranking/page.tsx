import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export const metadata = {
  title: 'Ranking de hunters — Nexhire',
}

interface RankRow {
  recruiter_id: string
  overall_score: number
  level: string
  total_submissions: number
  total_hires: number
  hr_approval_rate: number
  client_approval_rate: number
  recruiters: { user_id: string } | { user_id: string }[] | null
}

/**
 * Pseudônimo determinístico baseado em hash leve do recruiter_id.
 * Hunter vê seu próprio nome real; outros aparecem como "Hunter #ABC".
 */
function pseudonym(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  const abs = Math.abs(hash).toString(36).toUpperCase().slice(0, 3).padStart(3, '0')
  return `Hunter #${abs}`
}

const levelLabel: Record<string, string> = {
  beginner: 'Iniciante',
  specialist: 'Especialista',
  top_hunter: 'Top Hunter',
}

const levelVariant: Record<string, 'gray' | 'blue' | 'dark'> = {
  beginner: 'gray',
  specialist: 'blue',
  top_hunter: 'dark',
}

export default async function HuntersRankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: top } = await admin
    .from('recruiter_scores')
    .select(
      'recruiter_id, overall_score, level, total_submissions, total_hires, hr_approval_rate, client_approval_rate, recruiters(user_id)',
    )
    .gt('total_submissions', 0)
    .order('overall_score', { ascending: false })
    .limit(20)
    .returns<RankRow[]>()

  const rows = top ?? []

  // Identifica o recruiter do user atual pra mostrar nome real só nele
  const { data: myRecruiter } = await admin
    .from('recruiters')
    .select('id, users(full_name)')
    .eq('user_id', user.id)
    .single()

  const myRecruiterId = myRecruiter?.id as string | undefined
  const myUserRel = myRecruiter?.users as
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null
    | undefined
  const myFullName =
    (Array.isArray(myUserRel) ? myUserRel[0]?.full_name : myUserRel?.full_name) ?? null

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Marketplace"
        title="Ranking de"
        titleAccent="hunters"
        subtitle="Top 20 hunters por score geral. Nomes pseudonimizados — só você se vê pelo nome real."
      />

      {rows.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-sm" style={{ color: 'var(--text-4)' }}>
            Sem dados de ranking ainda — assim que hunters começarem a enviar candidatos, o ranking aparece aqui.
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="flex flex-col divide-y divide-(--border-1)">
            {rows.map((row, i) => {
              const isMe = row.recruiter_id === myRecruiterId
              const displayName = isMe
                ? `${myFullName || 'Você'} (você)`
                : pseudonym(row.recruiter_id)
              return (
                <div
                  key={row.recruiter_id}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: isMe ? 'var(--accent-bg)' : undefined,
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: i < 3 ? 'var(--text-1)' : 'var(--bg-elev-2)',
                      color: i < 3 ? 'var(--bg-1)' : 'var(--text-3)',
                      display: 'grid',
                      placeItems: 'center',
                                            fontSize: '15px',
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                    aria-label={`Posição ${i + 1}`}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text-1)',
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {displayName}
                      </span>
                      <Badge variant={levelVariant[row.level] ?? 'gray'} size="sm">
                        {levelLabel[row.level] ?? row.level}
                      </Badge>
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-4)',
                        marginTop: '4px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {row.total_submissions} envios · {row.total_hires} contratações · HR{' '}
                      {Number(row.hr_approval_rate).toFixed(0)}% · Cliente{' '}
                      {Number(row.client_approval_rate).toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                                                fontSize: '24px',
                        lineHeight: 1,
                        color: 'var(--text-1)',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {Number(row.overall_score).toFixed(0)}
                      <span
                        style={{ fontSize: '11px', color: 'var(--text-4)', marginLeft: '2px' }}
                      >
                        /100
                      </span>
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '9px',
                        color: 'var(--text-4)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginTop: '2px',
                      }}
                    >
                      score geral
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
