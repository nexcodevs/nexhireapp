import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'

export default async function FilaSubmissoesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'hr_manager' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: submissoes } = await supabase
    .from('submissions')
    .select(`
      id,
      status,
      submitted_at,
      interview_summary,
      recruiter_notes,
      candidates ( id, full_name, current_title, location, email ),
      jobs ( id, title, seniority, companies ( name ) ),
      recruiters ( id, level, users ( full_name ) )
    `)
    .in('status', ['submitted', 'ai_analyzed'])
    .order('submitted_at', { ascending: true })

  const { count: pendentes } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .in('status', ['submitted', 'ai_analyzed'])

  const { count: aprovados } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'hr_approved')

  const { count: enviados } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent_to_client')

  type CandidateRel = { id: string; full_name: string | null; current_title: string | null; location: string | null; email: string | null }
  type CompanyRel = { name: string | null }
  type JobRel = { id: string; title: string | null; seniority: string | null; companies: CompanyRel | CompanyRel[] | null }
  type UserRel = { full_name: string | null }
  type RecruiterRel = { id: string; level: string | null; users: UserRel | UserRel[] | null }
  type SubmissionRow = {
    id: string
    status: string
    submitted_at: string
    interview_summary: string | null
    recruiter_notes: string | null
    candidates: CandidateRel | CandidateRel[] | null
    jobs: JobRel | JobRel[] | null
    recruiters: RecruiterRel | RecruiterRel[] | null
  }
  const pickOne = <T,>(rel: T | T[] | null | undefined): T | null =>
    Array.isArray(rel) ? rel[0] ?? null : rel ?? null

  const now = new Date().getTime()
  const rows = ((submissoes ?? []) as unknown as SubmissionRow[]).map((s) => {
    const candidate = pickOne(s.candidates)
    const jobRaw = pickOne(s.jobs)
    const recruiterRaw = pickOne(s.recruiters)
    const jobCompany = jobRaw ? pickOne(jobRaw.companies) : null
    const recruiterUser = recruiterRaw ? pickOne(recruiterRaw.users) : null
    const diasEspera = Math.floor(
      (now - new Date(s.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    return { s, candidate, jobRaw, recruiterRaw, jobCompany, recruiterUser, diasEspera }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Curadoria"
        title="Candidatos para"
        titleAccent="revisar"
        subtitle="Revise os candidatos enviados pelos hunters e aprove para envio ao cliente."
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="text-sm text-gray-600">Aguardando revisão</div>
          <div className="text-3xl font-semibold mt-2 text-gray-900">{pendentes || 0}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="text-sm text-gray-600">Na shortlist (aprovados)</div>
          <div className="text-3xl font-semibold mt-2 text-gray-900">{aprovados || 0}</div>
          {(aprovados || 0) > 0 && (
            <Link href="/hr/shortlist" className="text-sm text-green-700 hover:underline mt-2 inline-block">
              Enviar para cliente →
            </Link>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="text-sm text-gray-600">Já enviados ao cliente</div>
          <div className="text-3xl font-semibold mt-2 text-gray-900">{enviados || 0}</div>
        </div>
      </div>

      {!submissoes || submissoes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-gray-400 text-sm mb-2">Sem candidatos para revisar</div>
          <div className="text-gray-900 font-medium">Tudo em dia.</div>
          <p className="text-gray-600 text-sm mt-2">
            Quando hunters enviarem novos candidatos, eles aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">Candidato</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">Vaga</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">Hunter</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-6 py-3">Enviado</th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase px-6 py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map(({ s, candidate, jobRaw, recruiterRaw, jobCompany, recruiterUser, diasEspera }) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{candidate?.full_name}</div>
                      <div className="text-sm text-gray-600">{candidate?.current_title || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{jobRaw?.title}</div>
                      <div className="text-sm text-gray-600">{jobCompany?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{recruiterUser?.full_name}</div>
                      <Badge variant={recruiterRaw?.level === 'top_hunter' ? 'dark' : 'gray'} className="mt-1">
                        {recruiterRaw?.level === 'top_hunter' ? 'Top Hunter' : recruiterRaw?.level === 'specialist' ? 'Especialista' : 'Iniciante'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {diasEspera === 0 ? 'hoje' : `há ${diasEspera}d`}
                      </div>
                      {diasEspera >= 2 && (
                        <Badge variant="yellow" className="mt-1">SLA</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/hr/submissoes/${s.id}`}
                        className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800"
                      >
                        Revisar →
                      </Link>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}