import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { SubmissionStatus } from '@/types/database'

export const metadata = {
  title: 'Detalhes da vaga — Nexhire',
}

const statusInfo: Record<string, { label: string; variant: 'gray' | 'yellow' | 'green' | 'blue' | 'dark' | 'red' }> = {
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

const VISIBLE_STATUSES: SubmissionStatus[] = [
  'sent_to_client',
  'client_approved',
  'client_rejected',
  'interview_scheduled',
  'offer',
  'hired',
  'not_hired',
]

export default async function EmpresaVagaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!companyUser?.company_id) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('*, companies(name)')
    .eq('id', id)
    .eq('company_id', companyUser.company_id)
    .single()

  if (!job) notFound()

  const { data: subs } = await supabase
    .from('submissions')
    .select('status')
    .eq('job_id', id)
    .in('status', VISIBLE_STATUSES)

  const submissions = subs ?? []
  const stats = {
    recebidos: submissions.length,
    aguardando: submissions.filter(s => s.status === 'sent_to_client').length,
    aprovados: submissions.filter(s =>
      ['client_approved', 'interview_scheduled', 'offer', 'hired'].includes(s.status),
    ).length,
    entrevista: submissions.filter(s => s.status === 'interview_scheduled').length,
    contratado: submissions.filter(s => s.status === 'hired').length,
  }

  const status = statusInfo[job.status] ?? { label: job.status, variant: 'gray' as const }
  const company = (job.companies as { name: string | null } | null)?.name

  return (
    <div className="max-w-5xl">
      <Link
        href="/empresa/vagas"
        style={{
          fontSize: '13px',
          color: 'var(--color-muted)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '20px',
        }}
        className="hover:underline"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para vagas
      </Link>

      <PageHeader
        eyebrow="Vaga"
        title={job.title}
        titleAccent=""
        subtitle={[company, job.seniority, job.location, job.work_model]
          .filter(Boolean)
          .join(' · ')}
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href={`/empresa/vagas/${id}/candidatos`}>
              <Button variant="dark" size="md">
                Ver candidatos
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
            <Link href={`/empresa/vagas/${id}/pipeline`}>
              <Button variant="outline" size="md">Ver pipeline</Button>
            </Link>
          </div>
        }
      />

      <div style={{ marginBottom: '20px' }}>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card padding="md">
            <h2
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-subtle)',
                marginBottom: '12px',
              }}
            >
              Descrição
            </h2>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.65,
                color: 'var(--color-text)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {job.description || 'Sem descrição preenchida.'}
            </p>
          </Card>

          {stats.recebidos > 0 && (
            <Card padding="md">
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-subtle)',
                  marginBottom: '14px',
                }}
              >
                Funil de candidatos
              </h2>
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                role="list"
                aria-label="Funil de candidatos"
              >
                {[
                  { label: 'Recebidos', value: stats.recebidos, attention: false },
                  { label: 'Aguardando você', value: stats.aguardando, attention: stats.aguardando > 0 },
                  { label: 'Em entrevista', value: stats.entrevista, attention: false },
                  { label: 'Contratado', value: stats.contratado, attention: false },
                ].map(item => (
                  <div
                    key={item.label}
                    role="listitem"
                    style={{
                      background: item.attention ? 'var(--color-m100)' : 'var(--color-cream)',
                      border: '1px solid',
                      borderColor: item.attention ? 'var(--color-border-g)' : 'var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--color-subtle)',
                        marginBottom: '4px',
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="it"
                      style={{
                        fontSize: '26px',
                        color: item.value > 0 ? 'var(--color-g600)' : 'var(--color-subtle)',
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card padding="md">
            <h2
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-subtle)',
                marginBottom: '14px',
              }}
            >
              Detalhes
            </h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: 'Salário',
                  value: job.salary_min
                    ? `${formatCurrency(job.salary_min)}${job.salary_max ? ` — ${formatCurrency(job.salary_max)}` : ''}`
                    : 'Não informado',
                },
                { label: 'Contrato', value: job.employment_type || 'Não informado' },
                { label: 'Modalidade', value: job.work_model || 'Não informada' },
                {
                  label: 'Prazo de envios',
                  value: job.submission_deadline ? formatDate(job.submission_deadline) : 'Não definido',
                },
                {
                  label: 'Limite por hunter',
                  value: `${job.max_submissions_per_recruiter} candidato${job.max_submissions_per_recruiter !== 1 ? 's' : ''}`,
                },
                { label: 'Criada em', value: formatDate(job.created_at) },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-subtle)',
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 500,
                      color: 'var(--color-text)',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
