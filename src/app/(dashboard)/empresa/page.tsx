import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'

export const metadata = {
  title: 'Dashboard — Nexhire',
}

export default async function EmpresaDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('*, company_users(company_id, companies(name))')
    .eq('id', user.id)
    .single()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const jobsByStatus = {
    abertas: jobs?.filter(j => j.status === 'open_for_hunters').length || 0,
    em_curadoria: jobs?.filter(j => j.status === 'in_hr_curation').length || 0,
    enviadas: jobs?.filter(j => j.status === 'sent_to_client').length || 0,
    contratadas: jobs?.filter(j => j.status === 'hired').length || 0,
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#052E16] mb-1">
          Olá, {userData?.full_name?.split(' ')[0] || 'bem-vindo'}
        </h1>
        <p className="text-[#6B7280] text-sm">
          Aqui está o resumo das suas contratações
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Vagas abertas', value: jobsByStatus.abertas, color: 'text-[#16A34A]' },
          { label: 'Em curadoria', value: jobsByStatus.em_curadoria, color: 'text-[#F59E0B]' },
          { label: 'Com cliente', value: jobsByStatus.enviadas, color: 'text-[#3B82F6]' },
          { label: 'Contratações', value: jobsByStatus.contratadas, color: 'text-[#052E16]' },
        ].map(stat => (
          <Card key={stat.label} padding="md">
            <div className={`text-3xl font-bold mb-1 ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-sm text-[#6B7280]">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* CTA abrir vaga */}
      <Card padding="lg" className="mb-8 border-[#BBF7D0] bg-[#F0FDF4]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#052E16] mb-1">
              Precisa contratar?
            </h2>
            <p className="text-sm text-[#6B7280]">
              Abra uma vaga e a rede Nexhire começa a trabalhar.
            </p>
          </div>
          <Link
            href="/empresa/vagas/nova-vaga"
            className="inline-flex items-center gap-2 bg-[#052E16] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#064E1F] transition-colors flex-shrink-0"
          >
            Abrir vaga
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </Card>

      {/* Vagas recentes */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#052E16]">Vagas recentes</h2>
          <Link href="/empresa/vagas" className="text-sm text-[#16A34A] hover:underline">
            Ver todas
          </Link>
        </div>

        {!jobs || jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#9CA3AF] text-sm">Nenhuma vaga aberta ainda.</p>
            <Link
              href="/empresa/vagas/nova-vaga"
              className="inline-block mt-3 text-sm text-[#16A34A] font-medium hover:underline"
            >
              Abrir primeira vaga
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#F3F4F6]">
            {jobs.map(job => (
              <div key={job.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[#052E16]">{job.title}</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">
                    {new Date(job.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span className={`
                  text-xs font-medium px-2 py-1 rounded-full
                  ${job.status === 'open_for_hunters' ? 'bg-[#F0FDF4] text-[#16A34A]' : ''}
                  ${job.status === 'pending_hr_review' ? 'bg-[#FEF9C3] text-[#854D0E]' : ''}
                  ${job.status === 'hired' ? 'bg-[#052E16] text-[#00E676]' : ''}
                  ${!['open_for_hunters', 'pending_hr_review', 'hired'].includes(job.status) ? 'bg-[#F3F4F6] text-[#6B7280]' : ''}
                `}>
                  {job.status === 'open_for_hunters' && 'Aberta'}
                  {job.status === 'pending_hr_review' && 'Em revisão'}
                  {job.status === 'hired' && 'Contratado'}
                  {!['open_for_hunters', 'pending_hr_review', 'hired'].includes(job.status) && job.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}