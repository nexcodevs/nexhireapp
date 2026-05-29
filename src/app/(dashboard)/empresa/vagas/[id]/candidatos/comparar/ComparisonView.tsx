'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface Dimension {
  label: string
  values: Record<string, string>
}

interface Comparison {
  summary: string
  dimensions: Dimension[]
  recommendation: {
    winner_id: string
    reason: string
  }
}

interface ComparisonViewProps {
  submissionIds: string[]
  candidates: { id: string; name: string }[]
}

export default function ComparisonView({
  submissionIds,
  candidates,
}: ComparisonViewProps) {
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/ai/compare-candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionIds }),
        })
        if (cancelled) return
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          setError(data.error || 'IA não conseguiu comparar.')
          return
        }
        const { comparison } = (await res.json()) as { comparison: Comparison }
        setComparison(comparison)
      } catch (err) {
        console.warn('[compare]', err)
        if (!cancelled) setError('Falha de rede ao comparar.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [submissionIds])

  if (loading) {
    return (
      <Card padding="lg" className="text-center">
        <div className="py-8">
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-3)',
              fontStyle: 'italic',
            }}
          >
            IA analisando e comparando os candidatos…
          </p>
          <p style={{ fontSize: '11.5px', color: 'var(--text-4)', marginTop: '6px' }}>
            Costuma levar 15-30 segundos. Pode demorar mais se os CVs forem longos.
          </p>
        </div>
      </Card>
    )
  }

  if (error || !comparison) {
    return (
      <Card padding="md" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }}>
        <p style={{ fontSize: '13px', color: 'var(--warning-text)' }}>
          {error || 'Sem resultado.'}
        </p>
      </Card>
    )
  }

  const winner = candidates.find(c => c.id === comparison.recommendation.winner_id)

  return (
    <div className="flex flex-col gap-5">
      {/* Recomendação destacada */}
      <Card
        padding="lg"
        style={{
          background:
            'linear-gradient(135deg, var(--accent-bg) 0%, var(--bg-elev-1) 100%)',
          borderColor: 'var(--accent-border)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-text)',
            marginBottom: '8px',
          }}
        >
          Recomendação IA
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
          <h2
            className="it"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '40px',
              color: 'var(--accent-text)',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
            }}
          >
            {winner?.name ?? '—'}
          </h2>
        </div>
        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--text-1)',
            marginTop: '10px',
          }}
        >
          {comparison.recommendation.reason}
        </p>
      </Card>

      {/* Summary */}
      <Card padding="md">
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            marginBottom: '10px',
          }}
        >
          Resumo comparativo
        </div>
        <p
          style={{
            fontSize: '13.5px',
            lineHeight: 1.65,
            color: 'var(--text-2)',
          }}
        >
          {comparison.summary}
        </p>
      </Card>

      {/* Tabela dimensional */}
      <Card padding="none">
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-1)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
          }}
        >
          Comparação dimensional
        </div>

        {/* Header de candidatos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `180px repeat(${candidates.length}, 1fr)`,
            borderBottom: '1px solid var(--border-1)',
            background: 'var(--bg-elev-2)',
          }}
        >
          <div
            style={{
              padding: '10px 16px',
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              fontWeight: 600,
            }}
          >
            Dimensão
          </div>
          {candidates.map(c => {
            const isWinner = c.id === comparison.recommendation.winner_id
            return (
              <div
                key={c.id}
                style={{
                  padding: '10px 16px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: isWinner ? 'var(--accent-text)' : 'var(--text-1)',
                  borderLeft: '1px solid var(--border-1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {c.name}
                {isWinner && <Badge variant="green" size="sm">recomendado</Badge>}
              </div>
            )
          })}
        </div>

        {/* Linhas das dimensões */}
        {comparison.dimensions.map((dim, di) => (
          <div
            key={di}
            style={{
              display: 'grid',
              gridTemplateColumns: `180px repeat(${candidates.length}, 1fr)`,
              borderBottom:
                di < comparison.dimensions.length - 1
                  ? '1px solid var(--border-1)'
                  : 'none',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                fontSize: '12.5px',
                color: 'var(--text-3)',
                fontWeight: 500,
                background: 'var(--bg-elev-2)',
              }}
            >
              {dim.label}
            </div>
            {candidates.map(c => (
              <div
                key={c.id}
                style={{
                  padding: '14px 16px',
                  fontSize: '12.5px',
                  color: 'var(--text-1)',
                  borderLeft: '1px solid var(--border-1)',
                  lineHeight: 1.5,
                }}
              >
                {dim.values[c.id] || '—'}
              </div>
            ))}
          </div>
        ))}
      </Card>
    </div>
  )
}
