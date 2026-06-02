import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Link from 'next/link'
import Card from '@/components/ui/Card'

export const metadata = {
  title: 'Dashboard — Nexhire',
}

export default async function CandidatoDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: userData } = await admin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: availableJobs } = await admin
    .from('jobs')
    .select('id, title, seniority, location, work_model, salary_min, salary_max, created_at')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="max-w-4xl">
      {/* Header */}
     <PageHeader
        eyebrow="Sua jornada"
        title="Olá,"
        titleAccent={userData?.full_name?.split(' ')[0] || 'bem-vindo'}
        subtitle="Encontre vagas com fit real para o seu perfil."
      />

      {/* CTA */}
      <Card padding="lg" className="mb-8" style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text mb-1">
              Complete seu perfil
            </h2>
            <p className="text-sm text-muted">
              Adicione seu CV para aparecer no matching de vagas.
            </p>
          </div>
          <Link
            href="/candidato/perfil"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
            style={{ background: 'var(--text-1)', color: 'var(--text-on-dark)' }}
          >
            Completar perfil
          </Link>
        </div>
      </Card>

      {/* Vagas abertas */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-text">Vagas abertas</h2>
          <Link href="/candidato/vagas" className="text-sm text-g600 hover:underline">
            Ver todas
          </Link>
        </div>

        {!availableJobs || availableJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-subtle text-sm">
              Nenhuma vaga disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {availableJobs.map(job => (
              <Link
                key={job.id}
                href={`/candidato/vagas/${job.id}`}
                className="flex flex-col p-4 rounded-lg border transition-all hover:border-(--accent-border) hover:bg-(--accent-bg)"
                style={{ borderColor: 'var(--border-2)' }}
              >
                <div className="text-sm font-semibold text-text mb-1">
                  {job.title}
                </div>
                <div className="text-xs text-subtle mb-3">
                  {job.location} · {job.work_model} · {job.seniority}
                </div>
                {job.salary_min && (
                  <div className="text-xs font-medium text-g600 mt-auto">
                    R$ {job.salary_min.toLocaleString('pt-BR')}
                    {job.salary_max && ` — ${job.salary_max.toLocaleString('pt-BR')}`}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}