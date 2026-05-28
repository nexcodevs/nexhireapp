import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

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
        <h1 className="text-2xl font-bold text-[#052E16] mb-1">Candidatos</h1>
        <p className="text-[#6B7280] text-sm">
          {pending.length} para avaliar · {submissions?.length || 0} no total
        </p>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-[#D97706] uppercase tracking-wider mb-3">
            Para avaliar ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map(sub => (
              <Link key={sub.id} href={`/empresa/candidatos/${sub.id}`}>
                <Card padding="md" className="hover:border-[#FDE68A] transition-all cursor-pointer border-[#FEF3C7] bg-[#FFFBEB]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-[#052E16]">
                          {(sub.candidates as any)?.full_name}
                        </h3>
                        <Badge variant="yellow">Para avaliar</Badge>
                      </div>
                      <div className="text-xs text-[#9CA3AF]">
                        {(sub.candidates as any)?.current_title}
                        {(sub.candidates as any)?.location && ` · ${(sub.candidates as any)?.location}`}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        Vaga: <span className="font-medium">{(sub.jobs as any)?.title}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#9CA3AF] flex-shrink-0">
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
          <h2 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-3">
            Avaliados ({reviewed.length})
          </h2>
          <div className="flex flex-col gap-3">
            {reviewed.map(sub => (
              <Link key={sub.id} href={`/empresa/candidatos/${sub.id}`}>
                <Card padding="md" className="hover:border-[#BBF7D0] transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-[#052E16]">
                          {(sub.candidates as any)?.full_name}
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
                      <div className="text-xs text-[#9CA3AF]">
                        {(sub.candidates as any)?.current_title}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        Vaga: <span className="font-medium">{(sub.jobs as any)?.title}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#9CA3AF] flex-shrink-0">
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
            <p className="text-[#9CA3AF] text-sm">Nenhum candidato recebido ainda.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Os candidatos aparecerão aqui após aprovação do HR Manager.</p>
          </div>
        </Card>
      )}
    </div>
  )
}