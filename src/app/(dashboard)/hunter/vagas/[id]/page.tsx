import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import JobDetailView, { type JobDetailData } from '@/components/jobs/JobDetailView'
import SubmitTrigger from './SubmitTrigger'
import CompanyAvatar from '@/components/empresa/CompanyAvatar'

const ACTIVE_STATUSES = new Set([
  'submitted', 'ai_analyzed', 'hr_approved', 'sent_to_client',
  'client_approved', 'interview_scheduled', 'offer', 'hired',
])

const statusLabel: Record<string, string> = {
  submitted: 'Enviado',
  ai_analyzed: 'Em análise IA',
  hr_approved: 'Aprovado pelo HR',
  hr_rejected: 'Reprovado',
  sent_to_client: 'No cliente',
  client_approved: 'Cliente aprovou',
  client_rejected: 'Cliente recusou',
  interview_scheduled: 'Em entrevista',
  hired: 'Contratado',
}

type CandidateRel = { full_name: string | null }
type CompanyRel = { name: string | null; logo_url: string | null }

function pickOne<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

export default async function HunterVagaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Admin client pra leituras (RLS bloqueando — auth já validado acima)
  const admin = createAdminClient()

  const { data: recruiter } = await admin
    .from('recruiters')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: job } = await admin
    .from('jobs')
    .select('*, companies(name, logo_url)')
    .eq('id', id)
    .eq('status', 'open_for_hunters')
    .single()

  if (!job) notFound()

  const company = pickOne(job.companies as CompanyRel | CompanyRel[] | null | undefined)

  const { data: mySubmissions } = await admin
    .from('submissions')
    .select('id, status, candidates(full_name)')
    .eq('job_id', id)
    .eq('recruiter_id', recruiter?.id || '')

  const activeCount = mySubmissions?.filter(s => ACTIVE_STATUSES.has(s.status)).length ?? 0
  const limitReached = activeCount >= job.max_submissions_per_recruiter
  const deadlineExpired = job.submission_deadline
    ? new Date(job.submission_deadline) < new Date()
    : false
  const canSubmit = recruiter?.status === 'approved' && !limitReached && !deadlineExpired
  const remainingSlots = Math.max(0, job.max_submissions_per_recruiter - activeCount)

  return (
    <div className="max-w-4xl">
      <Link
        href="/hunter/vagas"
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
        ← Voltar pra vagas
      </Link>

      <div className="flex items-start gap-3 mb-5">
        <CompanyAvatar name={company?.name ?? null} logoPath={company?.logo_url ?? null} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 500,
              color: 'var(--text-1)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '4px',
            }}
          >
            {job.title}
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            {company?.name}
          </div>
        </div>
      </div>

      {/* CTA principal: enviar candidato, ou aviso */}
      {canSubmit && recruiter && (
        <div
          style={{
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
              {remainingSlots === 1
                ? 'Você tem 1 slot pra essa vaga'
                : `Você pode enviar até ${remainingSlots} candidatos`}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '2px' }}>
              IA pré-preenche o form analisando o CV.
            </div>
          </div>
          <SubmitTrigger
            jobId={job.id}
            jobTitle={job.title}
            recruiterId={recruiter.id}
            remainingSlots={remainingSlots}
          />
        </div>
      )}

      {!canSubmit && (
        <Card padding="md" className="mb-5" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--warning-text)', fontWeight: 500 }}>
            {recruiter?.status !== 'approved'
              ? 'Seu perfil ainda não foi aprovado. Você verá as vagas mas só envia após aprovação.'
              : limitReached
                ? `Você atingiu o limite de ${job.max_submissions_per_recruiter} candidatos pra essa vaga.`
                : 'O prazo para envio expirou.'}
          </p>
        </Card>
      )}

      {/* Detalhe estruturado da vaga */}
      <JobDetailView
        job={job as JobDetailData}
        showInterviewQuestions={false}
        showRecruiterRules={true}
      />

      {/* Meus candidatos enviados pra essa vaga */}
      {mySubmissions && mySubmissions.length > 0 && (
        <Card padding="md" className="mt-4">
          <h2
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              marginBottom: '12px',
            }}
          >
            Meus candidatos nessa vaga ({activeCount} ativo{activeCount === 1 ? '' : 's'} de {job.max_submissions_per_recruiter})
          </h2>
          <div className="flex flex-col gap-2">
            {mySubmissions.map(sub => {
              const subCandidate = pickOne(sub.candidates as CandidateRel | CandidateRel[] | null | undefined)
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg-elev-1)',
                    border: '1px solid var(--border-1)',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>
                    {subCandidate?.full_name}
                  </span>
                  <Badge
                    variant={
                      sub.status === 'hr_approved' ? 'green' :
                      sub.status === 'hr_rejected' ? 'red' :
                      sub.status === 'hired' ? 'dark' : 'gray'
                    }
                    size="sm"
                  >
                    {statusLabel[sub.status] ?? sub.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
