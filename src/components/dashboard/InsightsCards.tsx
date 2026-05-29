'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Insight {
  title: string
  message: string
  severity: 'positive' | 'attention' | 'neutral'
  cta?: { label: string; href: string }
}

interface InsightsCardsProps {
  role: 'company_user' | 'recruiter' | 'hr_manager' | 'admin'
}

const SEVERITY_STYLE: Record<
  Insight['severity'],
  { bg: string; border: string; eyebrow: string }
> = {
  positive: {
    bg: 'var(--accent-bg)',
    border: 'var(--accent-border)',
    eyebrow: 'var(--accent-text)',
  },
  attention: {
    bg: 'var(--warning-bg)',
    border: 'var(--warning-border)',
    eyebrow: 'var(--warning-text)',
  },
  neutral: {
    bg: 'var(--bg-elev-1)',
    border: 'var(--border-1)',
    eyebrow: 'var(--text-3)',
  },
}

export default function InsightsCards({ role }: InsightsCardsProps) {
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error || 'Não consegui gerar insights.')
        return
      }
      const data = (await res.json()) as { insights: Insight[] }
      setInsights(data.insights)
    } catch (err) {
      console.warn('[insights]', err)
      setError('Falha de rede.')
    } finally {
      setLoading(false)
    }
  }

  // Estado inicial — CTA discreto pra gerar insights
  if (insights === null && !loading) {
    return (
      <div
        style={{
          marginBottom: '24px',
          padding: '14px 18px',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, var(--neon) 0%, var(--green-600) 100%)',
            color: 'var(--green-950)',
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 600,
              color: 'var(--text-1)',
              letterSpacing: '-0.005em',
            }}
          >
            Pedir insights da IA
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-3)',
              marginTop: '2px',
            }}
          >
            A IA analisa seus dados e te dá 3-4 observações úteis. Usa créditos.
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="nx-btn nx-btn--primary nx-btn--size-sm"
          style={{ flexShrink: 0 }}
        >
          Gerar insights
        </button>
        {error && (
          <p
            role="alert"
            style={{
              fontSize: '12px',
              color: 'var(--danger-text)',
              width: '100%',
              marginTop: '4px',
            }}
          >
            {error}
          </p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div
        style={{
          marginBottom: '24px',
          padding: '14px 18px',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span
          aria-hidden
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid var(--accent-text)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span
          style={{
            fontSize: '12.5px',
            color: 'var(--text-3)',
            fontStyle: 'italic',
          }}
        >
          IA analisando seus dados…
        </span>
      </div>
    )
  }

  if (!insights || insights.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-text)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'var(--neon)',
              boxShadow: '0 0 6px var(--neon)',
            }}
          />
          Insights da IA
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            fontSize: '11.5px',
            color: 'var(--text-3)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          atualizar
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '10px',
        }}
      >
        {insights.map((insight, i) => {
          const palette = SEVERITY_STYLE[insight.severity]
          return (
            <div
              key={i}
              style={{
                padding: '14px 16px',
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                borderRadius: 'var(--r-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9.5px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: palette.eyebrow,
                  fontWeight: 600,
                }}
              >
                {insight.severity === 'positive' && 'Bom sinal'}
                {insight.severity === 'attention' && 'Requer atenção'}
                {insight.severity === 'neutral' && 'Observação'}
              </div>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: 'var(--text-1)',
                  letterSpacing: '-0.005em',
                }}
              >
                {insight.title}
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-2)',
                  lineHeight: 1.5,
                }}
              >
                {insight.message}
              </div>
              {insight.cta && (
                <Link
                  href={insight.cta.href}
                  style={{
                    fontSize: '12px',
                    color: 'var(--accent-text)',
                    fontWeight: 500,
                    textDecoration: 'underline',
                    marginTop: '4px',
                    alignSelf: 'flex-start',
                  }}
                >
                  {insight.cta.label} →
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
