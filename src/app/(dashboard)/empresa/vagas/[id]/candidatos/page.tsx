import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SelectableCandidatesList from './SelectableCandidatesList'
import type { SubmissionStatus } from '@/types/database'

export const metadata = {
  title: 'Candidatos da vaga — Nexhire',
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

interface RawSubmission {
  id: string
  status: SubmissionStatus
  submitted_at: string
  sent_to_client_at: string | null
  ai_score: number | null
  ai_summary: string | null
  candidates: { full_name: string; current_title: string | null; location: string | null } | null
  recruiters: { level: string | null; users: { full_name: string | null } | null } | null
}

export default async function EmpresaVagaCandidatosPage({
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
    .select('id, title, status, seniority, location, work_model, companies(name)')
    .eq('id', id)
    .eq('company_id', companyUser.company_id)
    .single<{ id: string; title: string; status: string; seniority: string | null; location: string | null; work_model: string | null; companies: { name: string | null } | null }>()

  if (!job) notFound()

  const { data: rawSubs } = await supabase
    .from('submissions')
    .select('id, status, submitted_at, sent_to_client_at, ai_score, ai_summary, candidates(full_name, current_title, location), recruiters(level, users(full_name))')
    .eq('job_id', id)
    .in('status', VISIBLE_STATUSES)
    .returns<RawSubmission[]>()

  const submissions = rawSubs ?? []

  // Rank by AI score (highest first, nulls last)
  const ranked = [...submissions].sort((a, b) => {
    if (a.ai_score === null && b.ai_score === null) return 0
    if (a.ai_score === null) return 1
    if (b.ai_score === null) return -1
    return b.ai_score - a.ai_score
  })

  const stats = {
    recebidos: submissions.length,
    aguardando: submissions.filter(s => s.status === 'sent_to_client').length,
    aprovados: submissions.filter(s =>
      ['client_approved', 'interview_scheduled', 'offer', 'hired'].includes(s.status),
    ).length,
    entrevista: submissions.filter(s => s.status === 'interview_scheduled').length,
    contratado: submissions.filter(s => s.status === 'hired').length,
  }

  const empty = submissions.length === 0

  return (
    <div className="max-w-6xl">
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
        eyebrow="Candidatos"
        title={job.title}
        titleAccent="curados"
        subtitle={[
          job.companies?.name,
          job.seniority,
          job.location,
          job.work_model,
        ]
          .filter(Boolean)
          .join(' · ')}
        action={
          <Link href={`/empresa/vagas/${id}/pipeline`}>
            <Button variant="outline" size="md">
              Ver pipeline
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        }
      />

      <FunnelStats stats={stats} />

      {empty ? (
        <Card padding="lg" className="text-center">
          <div className="py-12">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4"
              style={{
                background: 'var(--color-m100)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} style={{ stroke: 'var(--color-g600)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '4px' }}>
              Aguardando os primeiros candidatos
            </p>
            <p style={{ fontSize: '12.5px', color: 'var(--color-subtle)', lineHeight: 1.5, maxWidth: '420px', margin: '0 auto' }}>
              Hunters estão trabalhando nesta vaga. Você verá os perfis aqui assim que o HR concluir a curadoria.
            </p>
          </div>
        </Card>
      ) : (
        <SelectableCandidatesList ranked={ranked} jobId={id} />
      )}
    </div>
  )
}

interface FunnelStatsProps {
  stats: {
    recebidos: number
    aguardando: number
    aprovados: number
    entrevista: number
    contratado: number
  }
}

function FunnelStats({ stats }: FunnelStatsProps) {
  const items: Array<{ label: string; value: number; accent: 'neutral' | 'attention' | 'positive' }> = [
    { label: 'Recebidos', value: stats.recebidos, accent: 'neutral' },
    { label: 'Aguardando você', value: stats.aguardando, accent: 'attention' },
    { label: 'Aprovados', value: stats.aprovados, accent: 'positive' },
    { label: 'Em entrevista', value: stats.entrevista, accent: 'neutral' },
    { label: 'Contratado', value: stats.contratado, accent: 'positive' },
  ]

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6"
      role="list"
      aria-label="Funil de candidatos"
    >
      {items.map(item => {
        const numberColor =
          item.accent === 'attention'
            ? 'var(--color-g600)'
            : item.accent === 'positive'
              ? 'var(--color-g600)'
              : 'var(--color-text)'
        return (
          <div
            key={item.label}
            role="listitem"
            style={{
              background: item.accent === 'attention' ? 'var(--color-m100)' : 'var(--color-surf)',
              border: '1px solid',
              borderColor: item.accent === 'attention' ? 'var(--color-border-g)' : 'var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-subtle)',
                marginBottom: '6px',
              }}
            >
              {item.label}
            </div>
            <div
              className="it"
              style={{
                fontSize: '32px',
                color: numberColor,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {item.value}
            </div>
          </div>
        )
      })}
    </div>
  )
}

