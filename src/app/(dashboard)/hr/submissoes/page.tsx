import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Submissões — HR Manager — Nexhire',
}

export default async function HRSubmissoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['hr_manager', 'admin'].includes(userData?.role)) {
    redirect('/login')
  }

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      *,
      candidates(full_name, current_title, location, email),
      jobs(title, companies(name)),
      recruiters(users(full_name))
    `)
    .order('submitted_at', { ascending: false })

  const pending = submissions?.filter(s => s.status === 'submitted') || []
  const reviewed = submissions?.filter(s => s.status !== 'submitted') || []

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#052E16] mb-1">Submissões</h1>
        <p className="text-[#6B7280] text-sm">
          {pending.length} aguardando curadoria · {submissions?.length || 0} no total
        </p>
      </div>

      {/* Pendentes */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-[#D97706] uppercase tracking-wider mb-3">
            Aguardando curadoria ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map(sub => (
              <Link key={sub.id} href={`/hr/submissoes/${sub.id}`}>
                <Card padding="md" className="hover:border-[#FDE68A] transition-all cursor-pointer border-[#FEF3C7] bg-[#FFFBEB]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-[#052E16]">
                          {(sub.candidates as any)?.full_name}
                        </h3>
                        <Badge variant="yellow">Para curar</Badge>
                      </div>
                      <div className="text-xs text-[#9CA3AF]">
                        {(sub.candidates as any)?.current_title}
                        {(sub.candidates as any)?.location && ` · ${(sub.candidates as any)?.location}`}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        Vaga: <span className="font-medium">{(sub.jobs as any)?.title}</span>
                        {' · '}Hunter: {(sub.recruiters as any)?.users?.full_name}
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

      {/* Revisadas */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-3">
            Revisadas ({reviewed.length})
          </h2>
          <div className="flex flex-col gap-3">
            {reviewed.map(sub => (
              <Link key={sub.id} href={`/hr/submissoes/${sub.id}`}>
                <Card padding="md" className="hover:border-[#BBF7D0] transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-[#052E16]">
                          {(sub.candidates as any)?.full_name}
                        </h3>
                        <Badge variant={
                          sub.status === 'hr_approved' ? 'green' :
                          sub.status === 'hr_rejected' ? 'red' :
                          sub.status === 'sent_to_client' ? 'blue' :
                          sub.status === 'hired' ? 'dark' : 'gray'
                        }>
                          {sub.status === 'hr_approved' && 'Aprovado'}
                          {sub.status === 'hr_rejected' && 'Reprovado'}
                          {sub.status === 'sent_to_client' && 'Enviado ao cliente'}
                          {sub.status === 'client_approved' && 'Aprovado pelo cliente'}
                          {sub.status === 'hired' && 'Contratado'}
                          {!['hr_approved','hr_rejected','sent_to_client','client_approved','hired'].includes(sub.status) && sub.status}
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

      {!submissions || submissions.length === 0 && (
        <Card padding="lg" className="text-center">
          <p className="text-[#9CA3AF] text-sm py-6">Nenhuma submissão ainda.</p>
        </Card>
      )}
    </div>
  )
}