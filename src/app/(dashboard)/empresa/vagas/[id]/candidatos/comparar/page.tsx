import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import ComparisonView from './ComparisonView'

export const metadata = {
  title: 'Comparar candidatos — Nexhire',
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ids?: string }>
}

export default async function CompareCandidatesPage({
  params,
  searchParams,
}: PageProps) {
  const { id: jobId } = await params
  const { ids: idsParam } = await searchParams
  const ids = (idsParam ?? '').split(',').filter(Boolean)

  if (ids.length < 2 || ids.length > 4) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Confere acesso à vaga
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, seniority')
    .eq('id', jobId)
    .single()

  if (!job) notFound()

  const { data: subs } = await supabase
    .from('submissions')
    .select('id, candidates(full_name, current_title)')
    .in('id', ids)
    .eq('job_id', jobId)

  if (!subs || subs.length < 2) notFound()

  const candidates = subs.map(s => {
    const cRel = s.candidates as
      | { full_name: string | null; current_title: string | null }
      | { full_name: string | null; current_title: string | null }[]
      | null
    const c = Array.isArray(cRel) ? cRel[0] : cRel
    return {
      id: s.id,
      name: c?.full_name ?? 'Candidato',
      title: c?.current_title ?? null,
    }
  })

  return (
    <div className="max-w-6xl">
      <Link
        href={`/empresa/vagas/${jobId}/candidatos`}
        style={{
          fontSize: '12.5px',
          color: 'var(--text-3)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '16px',
        }}
        className="hover:underline"
      >
        ← Voltar pra lista
      </Link>

      <PageHeader
        eyebrow="Comparação IA"
        title="Comparando"
        titleAccent={`${candidates.length} candidatos`}
        subtitle={`Pra a vaga ${job.title}${job.seniority ? ` · ${job.seniority}` : ''}`}
      />

      <Card padding="md" className="mb-6">
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            marginBottom: '8px',
          }}
        >
          Candidatos em comparação
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {candidates.map(c => (
            <div
              key={c.id}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-elev-2)',
                border: '1px solid var(--border-1)',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{c.name}</div>
              {c.title && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-4)' }}>{c.title}</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <ComparisonView submissionIds={ids} candidates={candidates} />
    </div>
  )
}
