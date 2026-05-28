import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Minhas vagas — Nexhire',
}

const statusLabel: Record<string, { label: string; variant: 'gray' | 'yellow' | 'green' | 'blue' | 'dark' | 'red' }> = {
  draft: { label: 'Rascunho', variant: 'gray' },
  pending_hr_review: { label: 'Em revisão', variant: 'yellow' },
  open_for_hunters: { label: 'Aberta', variant: 'green' },
  submission_closed: { label: 'Envios fechados', variant: 'blue' },
  in_hr_curation: { label: 'Em curadoria', variant: 'blue' },
  sent_to_client: { label: 'Aguardando você', variant: 'yellow' },
  interviewing: { label: 'Em entrevista', variant: 'blue' },
  offer: { label: 'Em proposta', variant: 'dark' },
  hired: { label: 'Contratado', variant: 'green' },
  closed: { label: 'Encerrada', variant: 'gray' },
  cancelled: { label: 'Cancelada', variant: 'red' },
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
    .eq('company_id', companyUser?.company_id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Gestão"
        title="Minhas"
        titleAccent="vagas"
        subtitle={`${jobs?.length || 0} vaga${jobs?.length !== 1 ? 's' : ''} no total`}
        action={
          <Link href="/empresa/vagas/nova">
            <Button variant="dark" size="md">
              Nova vaga
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </Link>
        }
      />

      {!jobs || jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-12">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--color-m100)' }}
            >
              <svg className="w-6 h-6" style={{ color: 'var(--color-g600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--color-text)', fontWeight: 500 }}>
              Você ainda não tem vagas
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--color-subtle)' }}>
              Crie sua primeira vaga e receba candidatos curados em poucos dias.
            </p>
            <Link href="/empresa/vagas/nova">
              <Button variant="dark" size="md">Criar primeira vaga</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => {
            const status = statusLabel[job.status] || { label: job.status, variant: 'gray' as const }
            return (
              <Link key={job.id} href={`/empresa/vagas/${job.id}`} className="block">
                <Card padding="md" hover className="cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-base font-bold truncate" style={{ color: 'var(--color-text)' }}>
                          {job.title}
                        </h2>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--color-subtle)' }}>
                        {job.seniority && <span>{job.seniority}</span>}
                        {job.location && <span>· {job.location}</span>}
                        {job.work_model && <span>· {job.work_model}</span>}
                        {job.employment_type && <span>· {job.employment_type}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {job.salary_min && (
                        <div className="text-sm font-medium mono" style={{ color: 'var(--color-g600)' }}>
                          {formatCurrency(job.salary_min)}
                          {job.salary_max && ` — ${formatCurrency(job.salary_max)}`}
                        </div>
                      )}
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-subtle)' }}>
                        Criada em {formatDate(job.created_at)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
