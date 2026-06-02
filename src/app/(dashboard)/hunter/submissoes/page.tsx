import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate, getSubmissionStatusLabel, getSubmissionStatusVariant } from '@/lib/utils'

export const metadata = {
  title: 'Minhas submissões — Nexhire',
}

interface SubRow {
  id: string
  status: string
  submitted_at: string
  ai_score: number | null
  hunter_score: number | null
  candidates: { full_name: string | null; current_title: string | null } | null
  jobs: { id: string; title: string | null; companies: { name: string | null } | null } | null
}

const ACTIVE = new Set([
  'submitted', 'ai_analyzed', 'hr_approved', 'sent_to_client',
  'client_approved', 'interview_scheduled', 'offer',
])

export default async function MinhasSubmissoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: recruiter } = await admin
    .from('recruiters')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!recruiter) {
    return (
      <div className="max-w-5xl">
        <PageHeader
          eyebrow="Hunter"
          title="Minhas"
          titleAccent="submissões"
          subtitle="Você ainda não tem um perfil de hunter aprovado."
        />
        <Card padding="lg" className="text-center">
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            Para enviar candidatos, finalize seu cadastro de hunter.
          </p>
        </Card>
      </div>
    )
  }

  const { data: subsRaw } = await admin
    .from('submissions')
    .select(
      'id, status, submitted_at, ai_score, hunter_score, candidates(full_name, current_title), jobs(id, title, companies(name))',
    )
    .eq('recruiter_id', recruiter.id)
    .order('submitted_at', { ascending: false })
    .overrideTypes<SubRow[]>()

  const subs = subsRaw ?? []
  const ativos = subs.filter(s => ACTIVE.has(s.status))
  const contratacoes = subs.filter(s => s.status === 'hired')
  const reprovados = subs.filter(s => ['hr_rejected', 'client_rejected', 'not_hired', 'duplicate'].includes(s.status))

  function pickOne<T>(rel: T | T[] | null | undefined): T | null {
    if (!rel) return null
    return Array.isArray(rel) ? rel[0] ?? null : rel
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Hunter"
        title="Minhas"
        titleAccent="submissões"
        subtitle={`${subs.length} no total · ${ativos.length} em andamento · ${contratacoes.length} contratado${contratacoes.length === 1 ? '' : 's'}`}
      />

      {subs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>
              Nenhuma submissão ainda.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>
              Vai em <Link href="/hunter/vagas" style={{ color: 'var(--accent-text)' }}>vagas disponíveis</Link> e envia teu primeiro candidato.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="flex flex-col divide-y divide-(--border-1)">
            {subs.map(sub => {
              const candidate = pickOne(sub.candidates)
              const job = pickOne(sub.jobs)
              const company = job ? pickOne(job.companies) : null
              const status = {
                label: getSubmissionStatusLabel(sub.status),
                variant: getSubmissionStatusVariant(sub.status),
              }
              return (
                <div
                  key={sub.id}
                  style={{
                    padding: '14px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
                        {candidate?.full_name || 'Candidato'}
                      </span>
                      <Badge variant={status.variant} size="sm">
                        {status.label}
                      </Badge>
                      {sub.ai_score !== null && (
                        <span
                          className="mono"
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--text-4)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          IA {sub.ai_score}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {candidate?.current_title}
                      {job?.title && ` · ${job.title}`}
                      {company?.name && ` (${company.name})`}
                    </div>
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: '11px', color: 'var(--text-4)', textAlign: 'right' }}
                  >
                    {formatDate(sub.submitted_at)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {reprovados.length > 0 && (
        <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '14px' }}>
          Status reprovado/duplicado liberam slot pra você reenviar candidatos novos na mesma vaga.
        </p>
      )}
    </div>
  )
}
