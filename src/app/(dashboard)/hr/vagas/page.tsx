import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import { getJobStatusLabel, getJobStatusVariant, formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Vagas — HR Manager — Nexhire',
}

export default async function HRVagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  const pending = jobs?.filter(j => j.status === 'pending_hr_review') || []
  const others = jobs?.filter(j => j.status !== 'pending_hr_review') || []

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Catálogo"
        title="Todas as"
        titleAccent="vagas"
        subtitle={`${jobs?.length || 0} vagas no total · ${pending.length} aguardando revisão`}
      />

      {/* Vagas pendentes */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: '#D97706' }}
            />
            <h2
              className="text-xs font-semibold uppercase"
              style={{ color: '#D97706', letterSpacing: '0.14em' }}
            >
              Aguardando revisão ({pending.length})
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {pending.map(job => (
              <Link key={job.id} href={`/hr/vagas/${job.id}`} className="block">
                <Card padding="md" hover className="cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3
                          className="text-base font-bold truncate"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {job.title}
                        </h3>
                        <Badge variant="yellow">Em revisão</Badge>
                      </div>
                      <div
                        className="flex items-center gap-2 text-xs flex-wrap"
                        style={{ color: 'var(--color-subtle)' }}
                      >
                        <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>
                          {(job.companies as any)?.name}
                        </span>
                        {job.seniority && <span>· {job.seniority}</span>}
                        {job.location && <span>· {job.location}</span>}
                        {job.work_model && <span>· {job.work_model}</span>}
                      </div>
                    </div>
                    <div className="text-xs flex-shrink-0" style={{ color: 'var(--color-subtle)' }}>
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
          {pending.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--color-subtle)' }}
              />
              <h2
                className="text-xs font-semibold uppercase"
                style={{ color: 'var(--color-muted)', letterSpacing: '0.14em' }}
              >
                Demais vagas ({others.length})
              </h2>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {others.map(job => (
              <Link key={job.id} href={`/hr/vagas/${job.id}`} className="block">
                <Card padding="md" hover className="cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3
                          className="text-base font-bold truncate"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {job.title}
                        </h3>
                        <Badge variant={getJobStatusVariant(job.status) as any}>
                          {getJobStatusLabel(job.status)}
                        </Badge>
                      </div>
                      <div
                        className="flex items-center gap-2 text-xs flex-wrap"
                        style={{ color: 'var(--color-subtle)' }}
                      >
                        <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>
                          {(job.companies as any)?.name}
                        </span>
                        {job.seniority && <span>· {job.seniority}</span>}
                        {job.location && <span>· {job.location}</span>}
                        {job.work_model && <span>· {job.work_model}</span>}
                      </div>
                    </div>
                    <div className="text-xs flex-shrink-0" style={{ color: 'var(--color-subtle)' }}>
                      {formatDate(job.created_at)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!jobs || jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-12">
            <p className="text-sm" style={{ color: 'var(--color-subtle)' }}>
              Nenhuma vaga cadastrada ainda.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
