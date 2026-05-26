import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { getJobStatusLabel, getJobStatusVariant, formatDate, formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Minhas vagas — Nexhire',
}

export default async function EmpresaVagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyUser?.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#052E16] mb-1">
            Minhas vagas
          </h1>
          <p className="text-[#6B7280] text-sm">
            {jobs?.length || 0} vaga{jobs?.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <Link
          href="/empresa/vagas/nova-vaga"
          className="inline-flex items-center gap-2 bg-[#052E16] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#064E1F] transition-colors"
        >
          Nova vaga
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      {!jobs || jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#16A34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-[#052E16] mb-2">
              Nenhuma vaga aberta ainda
            </h2>
            <p className="text-sm text-[#6B7280] mb-4">
              Crie sua primeira vaga e a rede Nexhire começa a trabalhar.
            </p>
            <Link
              href="/empresa/vagas/nova-vaga"
              className="inline-flex items-center gap-2 bg-[#052E16] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#064E1F] transition-colors"
            >
              Abrir primeira vaga
            </Link>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => (
            <Link
              key={job.id}
              href={`/empresa/vagas/${job.id}`}
              className="block"
            >
              <Card padding="md" className="hover:border-[#BBF7D0] hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-base font-bold text-[#052E16] truncate">
                        {job.title}
                      </h2>
                      <Badge variant={getJobStatusVariant(job.status)}>
                        {getJobStatusLabel(job.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                      {job.seniority && <span>{job.seniority}</span>}
                      {job.location && <span>· {job.location}</span>}
                      {job.work_model && <span>· {job.work_model}</span>}
                      {job.employment_type && <span>· {job.employment_type}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {job.salary_min && (
                      <div className="text-sm font-medium text-[#16A34A]">
                        {formatCurrency(job.salary_min)}
                        {job.salary_max && ` — ${formatCurrency(job.salary_max)}`}
                      </div>
                    )}
                    <div className="text-xs text-[#9CA3AF] mt-0.5">
                      {formatDate(job.created_at)}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}