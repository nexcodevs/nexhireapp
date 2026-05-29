import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import AIAnalysisCard from '@/components/ui/AIAnalysisCard'
import ClientCandidateActions from '@/components/submissions/ClientCandidateActions'
import { formatDate } from '@/lib/utils'

export default async function EmpresaCandidatoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sub } = await supabase
    .from('submissions')
    .select('*, candidates(full_name, current_title, location, email, phone, linkedin_url), jobs(id, title, seniority, location, work_model, companies(name))')
    .eq('id', id)
    .single()

  if (!sub) notFound()

  type CandidateRel = {
    full_name: string | null
    current_title: string | null
    location: string | null
    email: string | null
    phone: string | null
    linkedin_url: string | null
  } | null

  type JobRel = {
    id: string
    title: string | null
    seniority: string | null
    location: string | null
    work_model: string | null
    companies: { name: string | null } | null
  } | null

  const candidate = sub.candidates as CandidateRel
  const job = sub.jobs as JobRel

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/empresa/candidatos" className="text-sm text-muted hover:text-text flex items-center gap-1 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para candidatos
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text">{candidate?.full_name}</h1>
              <Badge variant={
                sub.status === 'sent_to_client' ? 'yellow' :
                sub.status === 'client_approved' ? 'green' :
                sub.status === 'client_rejected' ? 'red' :
                sub.status === 'interview_scheduled' ? 'blue' :
                sub.status === 'hired' ? 'dark' : 'gray'
              }>
                {sub.status === 'sent_to_client' && 'Para avaliar'}
                {sub.status === 'client_approved' && 'Aprovado'}
                {sub.status === 'client_rejected' && 'Reprovado'}
                {sub.status === 'interview_scheduled' && 'Entrevista agendada'}
                {sub.status === 'hired' && 'Contratado'}
              </Badge>
            </div>
            <div className="text-sm text-muted">
              {candidate?.current_title}
              {candidate?.location && ` · ${candidate.location}`}
            </div>
          </div>
          {sub.ai_score && !sub.ai_summary && (
            <div className="flex flex-col items-center rounded-xl px-4 py-3 border" style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
              <span className="text-2xl font-bold" style={{ color: 'var(--accent-text)' }}>{sub.ai_score}</span>
              <span className="text-xs text-muted">AI Score</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {sub.status === 'sent_to_client' && (
            <ClientCandidateActions submissionId={sub.id} />
          )}
          {sub.status === 'client_approved' && (
            <ClientCandidateActions submissionId={sub.id} mode="schedule" />
          )}

          {sub.ai_summary && (
            <AIAnalysisCard
              candidateName={candidate?.full_name ?? undefined}
              score={Number(sub.ai_score ?? 0)}
              summary={sub.ai_summary}
            />
          )}

          <Card padding="md">
            <h2 className="text-base font-bold text-text mb-3">Sobre o candidato</h2>
            <p className="text-sm text-text2 leading-relaxed whitespace-pre-wrap">
              {sub.interview_summary || 'Resumo não disponível.'}
            </p>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {(candidate?.email || candidate?.phone || candidate?.linkedin_url) && (
            <Card padding="md">
              <h2 className="text-sm font-bold text-text mb-3">Contato</h2>
              <div className="flex flex-col gap-2.5">
                {candidate?.email && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-subtle">Email</span>
                    <span className="text-sm text-text">{candidate.email}</span>
                  </div>
                )}
                {candidate?.phone && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-subtle">Telefone</span>
                    <span className="text-sm text-text">{candidate.phone}</span>
                  </div>
                )}
                {candidate?.linkedin_url && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-subtle">LinkedIn</span>
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-g600 hover:underline">
                      Ver perfil
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card padding="md">
            <h2 className="text-sm font-bold text-text mb-3">Vaga</h2>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-text">{job?.title}</div>
              <div className="text-xs text-subtle">{job?.companies?.name}</div>
              <Link href={`/empresa/vagas/${job?.id}/candidatos`} className="text-xs text-g600 hover:underline">
                Ver outros candidatos da vaga
              </Link>
            </div>
          </Card>

          <Card padding="md">
            <h2 className="text-sm font-bold text-text mb-3">Detalhes</h2>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-subtle">Recebido em</span>
                <span className="text-sm text-text">{formatDate(sub.submitted_at)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}