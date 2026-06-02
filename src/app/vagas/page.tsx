import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import CompanyAvatar from '@/components/empresa/CompanyAvatar'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Vagas abertas — Nexhire',
  description: 'Vagas selecionadas em parceria com hunters especialistas. Aplique direto ou cadastre seu perfil pra ser encontrado.',
  openGraph: {
    title: 'Vagas abertas — Nexhire',
    description: 'Vagas selecionadas em parceria com hunters especialistas.',
  },
}

interface JobRow {
  id: string
  title: string
  seniority: string | null
  location: string | null
  work_model: string | null
  employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  created_at: string
  companies: { name: string | null; logo_url: string | null } | { name: string | null; logo_url: string | null }[] | null
}

function pickCompany(rel: JobRow['companies']): { name: string | null; logo_url: string | null } | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

export const revalidate = 300 // ISR: 5min — equilibra freshness e custo

export default async function PublicVagasPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('jobs')
    .select('id, title, seniority, location, work_model, employment_type, salary_min, salary_max, created_at, companies(name, logo_url)')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })
    .limit(60)

  const jobs = (data ?? []) as JobRow[]

  return (
    <>
      <section style={{ marginBottom: '32px' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            marginBottom: '8px',
          }}
        >
          Vagas abertas
        </p>
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 500,
            color: 'var(--text-1)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '12px',
          }}
        >
          Oportunidades selecionadas{' '}
          <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--accent-text)' }}>
            por hunters especialistas
          </em>
          .
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: 1.55, maxWidth: '640px' }}>
          IA + curadoria humana em cada vaga. Aplique direto ou crie seu perfil pra ser encontrado por hunters.
        </p>
      </section>

      {jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
            Nenhuma vaga aberta no momento. Volte em breve.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => {
            const company = pickCompany(job.companies)
            return (
              <Link key={job.id} href={`/vagas/${job.id}`} style={{ textDecoration: 'none' }}>
                <Card padding="md" hover>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <CompanyAvatar
                        name={company?.name ?? null}
                        logoPath={company?.logo_url ?? null}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <h2
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'var(--text-1)',
                            letterSpacing: '-0.005em',
                            marginBottom: '4px',
                          }}
                        >
                          {job.title}
                        </h2>
                        <div
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--text-3)',
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {company?.name && <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{company.name}</span>}
                          {job.seniority && <span>· {job.seniority}</span>}
                          {job.location && <span>· {job.location}</span>}
                          {job.work_model && <span>· {job.work_model}</span>}
                          {job.employment_type && <span>· {job.employment_type}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {job.salary_min ? (
                        <div
                          className="mono"
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--accent-text)',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {formatCurrency(job.salary_min)}
                          {job.salary_max ? ` — ${formatCurrency(job.salary_max)}` : '+'}
                        </div>
                      ) : (
                        <Badge variant="gray" size="sm">a combinar</Badge>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>
                        {formatDate(job.created_at)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <Card
        padding="lg"
        style={{
          background: 'var(--accent-bg)',
          borderColor: 'var(--accent-border)',
          marginTop: '32px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
          Hunter ou empresa?
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px', lineHeight: 1.55 }}>
          Hunters enviam candidatos e ganham por resultado. Empresas abrem vagas e recebem candidatos curados.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-on-dark)',
              background: 'var(--text-1)',
              padding: '10px 20px',
              borderRadius: 'var(--r-md)',
              textDecoration: 'none',
            }}
          >
            Criar conta gratuita
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--accent-text)',
              padding: '10px 20px',
              textDecoration: 'underline',
            }}
          >
            Já tenho conta
          </Link>
        </div>
      </Card>
    </>
  )
}
