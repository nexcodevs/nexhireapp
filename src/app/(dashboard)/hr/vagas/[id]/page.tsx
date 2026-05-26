import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { getJobStatusLabel, getJobStatusVariant, formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Vagas — HR Manager — Nexhire',
}

export default async function HRVagasPage() {
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

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  const pending = jobs?.filter(j => j.status === 'pending_hr_review') || []
  const others = jobs?.filter(j => j.status !== 'pending_hr_review') || []

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#052E16] mb-1">Vagas</h1>
        <p className="text-[#6B7280] text-sm">
          {jobs?.length || 0} vagas no total · {pending.length} aguardando revisão
        </p>
      </div>

      {/* Vagas pendentes */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-[#D97706] uppercase tracking-wider mb-3">
            Aguardando revisão ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map(job => (
              <Link key={job.id} href={`/hr/vagas/${job.id}`}>
                <Card padding="md" className="hover:border-[#FDE68A] hover:shadow-sm transition-all cursor-pointer border-[#FEF3C7] bg-[#FFFBEB]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-[#052E16] truncate">
                          {job.title}
                        </h3>
                        <Badge variant="yellow">Para revisar</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                        <span>{(job.companies as any)?.name}</span>
                        {job.seniority && <span>· {job.seniority}</span>}
                        {job.location && <span>· {job.location}</span>}
                        {job.work_model && <span>· {job.work_model}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-[#9CA3AF] flex-shrink-0">
                      {formatDate(job.created_at)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Outras vagas */}
      {others.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-3">
            Todas as vagas ({others.length})
          </h2>
          <div className="flex flex-col gap-3">
            {others.map(job => (
              <Link key={job.id} href={`/hr/vagas/${job.id}`}>
                <Card padding="md" className="hover:border-[#BBF7D0] hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-[#052E16] truncate">
                          {job.title}
                        </h3>
                        <Badge variant={getJobStatusVariant(job.status)}>
                          {getJobStatusLabel(job.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                        <span>{(job.companies as any)?.name}</span>
                        {job.seniority && <span>· {job.seniority}</span>}
                        {job.location && <span>· {job.location}</span>}
                        {job.work_model && <span>· {job.work_model}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-[#9CA3AF] flex-shrink-0">
                      {formatDate(job.created_at)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!jobs || jobs.length === 0 && (
        <Card padding="lg" className="text-center">
          <p className="text-[#9CA3AF] text-sm py-6">Nenhuma vaga ainda.</p>
        </Card>
      )}
    </div>
  )
}