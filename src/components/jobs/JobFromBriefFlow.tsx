'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import FormError from '@/components/ui/FormError'
import JobForm, { type JobFormInitialValues } from '@/components/jobs/JobForm'

function ReasoningDetails({ reasoning }: { reasoning: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        background: 'var(--bg-elev-2)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-md)',
        padding: '12px 14px',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--accent-text)',
          fontWeight: 600,
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        Ver raciocínio da IA
      </button>
      {open && (
        <p
          style={{
            marginTop: '10px',
            fontSize: '12.5px',
            color: 'var(--text-2)',
            lineHeight: 1.55,
          }}
        >
          {reasoning}
        </p>
      )}
    </div>
  )
}

interface JobFromBriefFlowProps {
  companyId: string
  userId?: string
}

interface Suggestion extends JobFormInitialValues {
  reasoning?: string
}

const EXAMPLE_BRIEF = `Ex: Procuro um Engenheiro de Machine Learning sênior, foco em recommendation systems. Remoto, R$ 15-18k CLT. Precisa de Python forte e experiência com MLOps.`

export default function JobFromBriefFlow({ companyId }: JobFromBriefFlowProps) {
  const [brief, setBrief] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)

  async function handleGenerate() {
    setError('')
    if (brief.trim().length < 15) {
      setError('Descreva a vaga com pelo menos uma frase completa.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, companyId }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error || 'IA não conseguiu gerar. Tente reescrever ou usar modo manual.')
        setLoading(false)
        return
      }

      const data = (await res.json()) as { suggestion: Suggestion }
      setSuggestion(data.suggestion)
    } catch (err) {
      console.error('[generate-job]', err)
      setError('Falha ao chamar a IA.')
    } finally {
      setLoading(false)
    }
  }

  function handleStartOver() {
    setSuggestion(null)
    setBrief('')
    setError('')
  }

  function handleManualMode() {
    setSuggestion({})
  }

  // Fase 2 — form preenchido
  if (suggestion !== null) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleStartOver}
            style={{
              fontSize: '12.5px',
              color: 'var(--text-3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            ← Recomeçar com outro brief
          </button>
          {suggestion.title && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-4)',
              }}
            >
              Rascunho IA
            </span>
          )}
        </div>

        {suggestion.reasoning && (
          <ReasoningDetails reasoning={suggestion.reasoning} />
        )}

        <JobForm
          companyId={companyId}
          initialValues={suggestion}
          aiGenerated={!!suggestion.title}
        />
      </div>
    )
  }

  // Fase 1 — brief conversacional
  return (
    <div className="flex flex-col gap-4">
      <div
        style={{
          padding: '20px',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-xl)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            aria-hidden
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--neon)',
              boxShadow: '0 0 6px var(--neon)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent-text)',
            }}
          >
            Criar vaga com IA
          </span>
        </div>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: 'var(--text-1)',
            lineHeight: 1.2,
            marginBottom: '8px',
          }}
        >
          Conta o que você precisa{' '}
          <span
            className="it"
            style={{
              color: 'var(--accent-text)',
            }}
          >
            contratar
          </span>
        </h2>
        <p
          style={{
            fontSize: '13.5px',
            color: 'var(--text-3)',
            lineHeight: 1.55,
            marginBottom: '16px',
          }}
        >
          Escreve em texto livre — cargo, senioridade, modalidade, salário, principais
          requisitos. A IA monta a vaga inteira pra você revisar.
        </p>

        <Textarea
          value={brief}
          onChange={e => setBrief(e.target.value)}
          placeholder={EXAMPLE_BRIEF}
          rows={6}
          disabled={loading}
        />

        {error && (
          <div style={{ marginTop: '12px' }}>
            <FormError>{error}</FormError>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={handleManualMode}
            disabled={loading}
            style={{
              fontSize: '12.5px',
              color: 'var(--text-3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Prefiro preencher manualmente
          </button>
          <Button
            type="button"
            onClick={handleGenerate}
            loading={loading}
            variant="primary"
            iconEnd
          >
            Gerar vaga com IA
          </Button>
        </div>
      </div>
    </div>
  )
}
