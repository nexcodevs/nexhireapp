import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import JobDetailView, { type JobDetailData } from '@/components/jobs/JobDetailView'
import Card from '@/components/ui/Card'

export const revalidate = 300

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  const { data: job } = await admin
    .from('jobs')
    .select('title, seniority, location, work_model, companies(name)')
    .eq('id', id)
    .eq('status', 'open_for_hunters')
    .maybeSingle<{ title: string; seniority: string | null; location: string | null; work_model: string | null; companies: { name: string | null } | { name: string | null }[] | null }>()

  if (!job) return { title: 'Vaga não encontrada — Nexhire' }

  const company = Array.isArray(job.companies) ? job.companies[0] : job.companies
  const companyName = company?.name ?? 'Nexhire'
  const subtitle = [job.seniority, job.location, job.work_model].filter(Boolean).join(' · ')
  const fullTitle = `${job.title} · ${companyName} — Nexhire`

  return {
    title: fullTitle,
    description: `${companyName} contratando ${job.title}${subtitle ? ` (${subtitle})` : ''}. Aplique pela Nexhire.`,
    openGraph: { title: fullTitle, description: subtitle || undefined },
  }
}

export default async function PublicJobDetailPage({ params }: PageProps) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: job } = await admin
    .from('jobs')
    .select('*, companies(name, logo_url)')
    .eq('id', id)
    .eq('status', 'open_for_hunters')
    .maybeSingle()

  if (!job) notFound()

  const signupHref = `/signup?role=candidate&job=${encodeURIComponent(id)}`
  const loginHref = `/login?next=${encodeURIComponent(`/vagas/${id}`)}`

  return (
    <>
      <Link
        href="/vagas"
        style={{
          fontSize: '13px',
          color: 'var(--text-3)',
          textDecoration: 'none',
          marginBottom: '18px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
        className="hover:underline"
      >
        ← Todas as vagas
      </Link>

      <Card
        padding="lg"
        style={{
          background: 'var(--accent-bg)',
          borderColor: 'var(--accent-border)',
          marginBottom: '24px',
        }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-1)',
                marginBottom: '2px',
                letterSpacing: '-0.005em',
              }}
            >
              Pra aplicar nesta vaga
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.55 }}>
              Crie sua conta de candidato em 1 minuto. Ou entre se já tem cadastro.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={signupHref}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-on-dark)',
                background: 'var(--text-1)',
                padding: '10px 18px',
                borderRadius: 'var(--r-md)',
                textDecoration: 'none',
              }}
            >
              Criar conta pra aplicar
            </Link>
            <Link
              href={loginHref}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--accent-text)',
                padding: '10px 18px',
                textDecoration: 'underline',
              }}
            >
              Entrar
            </Link>
          </div>
        </div>
      </Card>

      <JobDetailView
        job={job as JobDetailData}
        showInterviewQuestions={false}
        showRecruiterRules={false}
      />
    </>
  )
}
