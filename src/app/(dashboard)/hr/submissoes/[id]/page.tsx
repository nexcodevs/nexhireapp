import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import HRSubmissionActions from '@/components/submissions/HRSubmissionActions'
import AIAnalyzeButton from '@/components/submissions/AIAnalyzeButton'
import { formatDate } from '@/lib/utils'

export default async function HRSubmissaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!['hr_manager', 'admin'].includes(userData?.role)) redirect('/login')

  const { data: sub } = await supabase
    .from('submissions')
    .select('*, candidates(full_name, current_title, location, email, phone, linkedin_url), jobs(id, title, seniority, location, work_model, companies(name)), recruiters(users(full_name, email))')
    .eq('id', id)
    .single()

  if (!sub) notFound()

  const candidate = sub.candidates as any
  const job = sub.jobs as any
  const recruiter = sub.recruiters as any

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/hr/submissoes" className="text-sm text-[#6B7280] hover:text-[#052E16] flex items-center gap-1 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para submissões
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#052E16]">{candidate?.full_name}</h1>
              <Badge variant={
                sub.status === 'submitted' ? 'yellow' :
                sub.status === 'ai_analyzed' ? 'blue' :
                sub.status === 'hr_approved' ? 'green' :
                sub.status === 'hr_rejected' ? 'red' :
                sub.status === 'sent_to_client' ? 'blue' :
                sub.status === 'hired' ? 'dark' : 'gray'
              }>
                {sub.status === 'submitted' && 'Aguardando curadoria'}
                {sub.status === 'ai_analyzed' && 'Analisado pela IA'}
                {sub.status === 'hr_approved' && 'Aprovado'}
                {sub.status === 'hr_rejected' && 'Reprovado'}
                {sub.status === 'sent_to_client' && 'Enviado ao cliente'}
                {sub.status === 'hired' && 'Contratado'}
              </Badge>
            </div>
            <div className="text-sm text-[#6B7280]">
              {candidate?.current_title}
              {candidate?.location && ` · ${candidate.location}`}
            </div>
          </div>
          {sub.ai_score && (
            <div className="flex flex-col items-center bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3">
              <span className="text-2xl font-bold text-[#16A34A]">{sub.ai_score}</span>
              <span className="text-xs text-[#6B7280]">AI Score</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Análise IA + Ações HR */}
          {(sub.status === 'submitted' || sub.status === 'ai_analyzed') && (
            <div className="flex flex-col gap-3">
              {sub.status === 'submitted' && (
                <Card padding="md" className="border-[#BBF7D0] bg-[#F0FDF4]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-[#052E16] mb-0.5">Analisar com IA</h2>
                      <p className="text-xs text-[#6B7280]">Gera score, resumo e pontos de atenção automaticamente.</p>
                    </div>
                    <AIAnalyzeButton submissionId={sub.id} />
                  </div>
                </Card>
              )}
              <HRSubmissionActions submissionId={sub.id} jobId={job?.id} />
            </div>
          )}

          {sub.status === 'hr_approved' && (
            <HRSubmissionActions submissionId={sub.id} jobId={job?.id} mode="send" />
          )}

          {/* AI Summary */}
          {sub.ai_summary && (
            <Card padding="md">
              <h2 className="text-base font-bold text-[#052E16] mb-3">Análise da IA</h2>
              <p className="text-sm text-[#374151] leading-relaxed mb-3">{sub.ai_summary}</p>
              {sub.ai_risks && (sub.ai_risks as string[]).length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-red-500 mb-1">Riscos</div>
                  <div className="flex flex-wrap gap-1">
                    {(sub.ai_risks as string[]).map((risk, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{risk}</span>
                    ))}
                  </div>
                </div>
              )}
              {sub.ai_gaps && (sub.ai_gaps as string[]).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[#D97706] mb-1">Gaps</div>
                  <div className="flex flex-wrap gap-1">
                    {(sub.ai_gaps as string[]).map((gap, i) => (
                      <span key={i} className="text-xs bg-[#FFFBEB] text-[#D97706] px-2 py-0.5 rounded-full">{gap}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card padding="md">
            <h2 className="text-base font-bold text-[#052E16] mb-3">Resumo da entrevista</h2>
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
              {sub.interview_summary || 'Sem resumo.'}
            </p>
          </Card>

          {sub.recruiter_notes && (
            <Card padding="md">
              <h2 className="text-base font-bold text-[#052E16] mb-3">Notas do hunter</h2>
              <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{sub.recruiter_notes}</p>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card padding="md">
            <h2 className="text-sm font-bold text-[#052E16] mb-3">Contato</h2>
            <div className="flex flex-col gap-2.5">
              {candidate?.email && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#9CA3AF]">Email</span>
                  <span className="text-sm text-[#052E16]">{candidate.email}</span>
                </div>
              )}
              {candidate?.phone && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#9CA3AF]">Telefone</span>
                  <span className="text-sm text-[#052E16]">{candidate.phone}</span>
                </div>
              )}
              {candidate?.linkedin_url && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#9CA3AF]">LinkedIn</span>
                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#16A34A] hover:underline">
                    Ver perfil
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card padding="md">
            <h2 className="text-sm font-bold text-[#052E16] mb-3">Vaga</h2>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-[#052E16]">{job?.title}</div>
              <div className="text-xs text-[#9CA3AF]">{job?.companies?.name}</div>
              <Link href={`/hr/vagas/${job?.id}`} className="text-xs text-[#16A34A] hover:underline">Ver vaga</Link>
            </div>
          </Card>

          <Card padding="md">
            <h2 className="text-sm font-bold text-[#052E16] mb-3">Hunter</h2>
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-[#052E16]">{recruiter?.users?.full_name}</div>
              <div className="text-xs text-[#9CA3AF]">{recruiter?.users?.email}</div>
            </div>
          </Card>

          <Card padding="md">
            <h2 className="text-sm font-bold text-[#052E16] mb-3">Datas</h2>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[#9CA3AF]">Enviado em</span>
                <span className="text-sm text-[#052E16]">{formatDate(sub.submitted_at)}</span>
              </div>
              {sub.ownership_expires_at && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#9CA3AF]">Ownership expira</span>
                  <span className="text-sm text-[#052E16]">{formatDate(sub.ownership_expires_at)}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}