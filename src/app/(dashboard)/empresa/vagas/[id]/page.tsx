import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import JobDetailView, { type JobDetailData } from '@/components/jobs/JobDetailView'
import { formatDate } from '@/lib/utils'
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
    entrevista: submissions.filter(s => s.status === 'interview_scheduled').length,
    contratado: submissions.filter(s => s.status === 'hired').length,
  }

  const status = statusInfo[job.status] ?? { label: job.status, variant: 'gray' as const }

  return (
    <div className="max-w-5xl">
      <Link
        href="/empresa/vagas"
        style={{
          fontSize: '13px',
          color: 'var(--text-3)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '20px',
        }}
        className="hover:underline"
      >
        ← Voltar para vagas
      </Link>

      <PageHeader
        eyebrow="Vaga"
        title={job.title}
        titleAccent=""
        subtitle={[job.seniority, job.location, job.work_model].filter(Boolean).join(' · ')}
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href={`/empresa/vagas/${id}/candidatos`}>
              <Button variant="dark" size="md">
                Ver candidatos
              </Button>
            </Link>
            <Link href={`/empresa/vagas/${id}/pipeline`}>
              <Button variant="outline" size="md">Pipeline</Button>
            </Link>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Badge variant={status.variant}>{status.label}</Badge>
        <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-4)' }}>
          Criada em {formatDate(job.created_at)}
        </span>
      </div>

      {/* Funil compacto antes do detalhe da vaga */}
      {stats.recebidos > 0 && (
        <Card padding="md" className="mb-4">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px',
            }}
            role="list"
            aria-label="Funil de candidatos"
          >
            {[
              { label: 'Recebidos', value: stats.recebidos, attention: false },
              { label: 'Aguardando você', value: stats.aguardando, attention: stats.aguardando > 0 },
              { label: 'Em entrevista', value: stats.entrevista, attention: false },
              { label: 'Contratado', value: stats.contratado, attention: false },
            ].map(item => (
              <div key={item.label} role="listitem">
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: item.attention ? 'var(--accent-text)' : 'var(--text-4)',
                    marginBottom: '4px',
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 500,
                    color: item.attention ? 'var(--accent-text)' : 'var(--text-1)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Detalhe estruturado da vaga */}
      <JobDetailView
        job={job as JobDetailData}
        showInterviewQuestions={true}
        showRecruiterRules={true}
      />
    </div>
  )
}
