import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

type CandidateRel = {
  full_name: string | null
  current_title: string | null
  location: string | null
} | null

type JobRel = {
  title: string | null
} | null

export const metadata = {
  title: 'Candidatos — Nexhire',
}

export default async function EmpresaCandidatosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, candidates(full_name, current_title, location), jobs(title)')
    .in('status', ['sent_to_client', 'client_approved', 'client_rejected', 'interview_scheduled', 'offer', 'hired'])
    .eq('jobs.company_id', companyUser?.company_id)
    .order('submitted_at', { ascending: false })

  const pending = submissions?.filter(s => s.status === 'sent_to_client') || []
  const reviewed = submissions?.filter(s => s.status !== 'sent_to_client') || []

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-1">Candidatos</h1>
        <p className="text-muted text-sm">
          {pending.length} para avaliar · {submissions?.length || 0} no total
        </p>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--warning-text)' }}>
            Para avaliar ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map(sub => (
              <Link key={sub.id} href={`/empresa/candidatos/${sub.id}`}>
                <Card padding="md" className="transition-all cursor-pointer" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-text">
                          {(sub.candidates as CandidateRel)?.full_name}
                        </h3>
                        <Badge variant="yellow">Para avaliar</Badge>
                      </div>
                      <div className="text-xs text-subtle">
                        {(sub.candidates as CandidateRel)?.current_title}
                        {(sub.candidates as CandidateRel)?.location && ` · ${(sub.candidates as CandidateRel)?.location}`}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        Vaga: <span className="font-medium">{(sub.jobs as JobRel)?.title}</span>
                      </div>
                    </div>
                    <div className="text-xs text-subtle shrink-0">
                      {formatDate(sub.submitted_at)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
            Avaliados ({reviewed.length})
          </h2>
          <div className="flex flex-col gap-3">
            {reviewed.map(sub => (
              <Link key={sub.id} href={`/empresa/candidatos/${sub.id}`}>
                <Card padding="md" className="transition-all cursor-pointer hover:border-(--accent-border)">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-text">
                          {(sub.candidates as CandidateRel)?.full_name}
                        </h3>
                        <Badge variant={
                          sub.status === 'client_approved' ? 'green' :
                          sub.status === 'client_rejected' ? 'red' :
                          sub.status === 'interview_scheduled' ? 'blue' :
                          sub.status === 'hired' ? 'dark' : 'gray'
                        }>
                          {sub.status === 'client_approved' && 'Aprovado'}
                          {sub.status === 'client_rejected' && 'Reprovado'}
                          {sub.status === 'interview_scheduled' && 'Entrevista agendada'}
                          {sub.status === 'offer' && 'Proposta'}
                          {sub.status === 'hired' && 'Contratado'}
                        </Badge>
                      </div>
                      <div className="text-xs text-subtle">
                        {(sub.candidates as CandidateRel)?.current_title}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        Vaga: <span className="font-medium">{(sub.jobs as JobRel)?.title}</span>
                      </div>
                    </div>
                    <div className="text-xs text-subtle shrink-0">
                      {formatDate(sub.submitted_at)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!submissions || submissions.length === 0) && (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p className="text-subtle text-sm">Nenhum candidato recebido ainda.</p>
            <p className="text-xs text-subtle mt-1">Os candidatos aparecerão aqui após aprovação do HR Manager.</p>
          </div>
        </Card>
      )}
    </div>
  )
}