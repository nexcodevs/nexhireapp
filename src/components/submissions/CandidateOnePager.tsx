'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'

interface CandidatePitch {
  pitch: string
  match_percent: number
  strengths: string[]
  gaps: string[]
  risks: string[]
}

interface ChatExchange {
  q: string
  a: string
  loading?: boolean
}

interface CandidateOnePagerProps {
  submissionId: string
  candidateName: string
  candidateTitle: string | null
  jobTitle: string
  /** Pitch pré-gerado (cached no banco). Se null, mostra botão pra gerar. */
  cachedPitch?: CandidatePitch | null
}

const SUGGESTED_QUESTIONS = [
  'Quais 3 melhores perguntas técnicas pra entrevista?',
  'Quais red flags devo investigar?',
  'Como ele se compara com o que pedi na vaga?',
]

export default function CandidateOnePager({
  submissionId,
  candidateName,
  candidateTitle,
  jobTitle,
  cachedPitch = null,
}: CandidateOnePagerProps) {
  const [pitch, setPitch] = useState<CandidatePitch | null>(cachedPitch)
  const [loadingPitch, setLoadingPitch] = useState(false)
  const [pitchError, setPitchError] = useState('')

  const [chatHistory, setChatHistory] = useState<ChatExchange[]>([])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [chatEnabled, setChatEnabled] = useState(false)

  async function generatePitch(force = false) {
    setLoadingPitch(true)
    setPitchError('')
    try {
      const res = await fetch('/api/ai/candidate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, force }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setPitchError(data.error || 'IA não conseguiu gerar pitch deste candidato.')
        return
      }
      const data = (await res.json()) as { pitch: CandidatePitch }
      setPitch(data.pitch)
    } catch (err) {
      console.warn('[pitch]', err)
      setPitchError('Falha ao carregar pitch.')
    } finally {
      setLoadingPitch(false)
    }
  }

  async function ask(q: string) {
    const trimmed = q.trim()
    if (trimmed.length < 5 || asking) return

    setAsking(true)
    setQuestion('')
    setChatHistory(prev => [...prev, { q: trimmed, a: '', loading: true }])

    try {
      const res = await fetch('/api/ai/ask-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, question: trimmed }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setChatHistory(prev =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { q: trimmed, a: data.error || 'IA não respondeu. Tente reformular.' }
              : m,
          ),
        )
        return
      }
      const { answer } = (await res.json()) as { answer: string }
      setChatHistory(prev =>
        prev.map((m, i) => (i === prev.length - 1 ? { q: trimmed, a: answer } : m)),
      )
    } finally {
      setAsking(false)
    }
  }

  // Estado inicial: sem pitch — mostra CTA discreto
  if (!pitch && !loadingPitch) {
    return (
      <div
        style={{
          padding: '20px',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <span
          aria-hidden
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--r-md)',
            background:
              'linear-gradient(135deg, var(--neon) 0%, var(--green-700) 100%)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 8px 20px rgba(0,230,118,.3), inset 0 1px 0 rgba(255,255,255,.3)',
            flexShrink: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--green-950)"
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
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-1)',
              letterSpacing: '-0.005em',
            }}
          >
            Gerar pitch IA pra este candidato
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-3)',
              marginTop: '2px',
              lineHeight: 1.5,
            }}
          >
            A IA lê o CV, compara com a vaga e te dá um pitch direto + chat pra
            perguntas. Geração única — fica salvo pra próximas aberturas.
          </div>
          {pitchError && (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--danger-text)',
                marginTop: '6px',
              }}
            >
              {pitchError}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => generatePitch(false)}
          className="nx-btn nx-btn--primary nx-btn--size-md"
          style={{ flexShrink: 0 }}
        >
          Gerar pitch IA
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pitch hero */}
      <div
        style={{
          padding: '28px',
          background:
            'linear-gradient(135deg, var(--bg-elev-1) 0%, var(--bg-elev-2) 100%)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-xl)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '500px',
            height: '500px',
            background:
              'radial-gradient(circle, rgba(0,230,118,.08) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            position: 'relative',
            gap: '8px',
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
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--neon)',
                boxShadow: '0 0 6px var(--neon)',
              }}
            />
            Pitch IA · pra essa vaga
          </div>
          {pitch && (
            <button
              type="button"
              onClick={() => generatePitch(true)}
              disabled={loadingPitch}
              style={{
                fontSize: '11px',
                color: 'var(--text-3)',
                background: 'transparent',
                border: 'none',
                cursor: loadingPitch ? 'not-allowed' : 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              {loadingPitch ? 'regenerando…' : 'regenerar'}
            </button>
          )}
        </div>

        {loadingPitch && !pitch ? (
          <div
            style={{
              fontSize: '14px',
              color: 'var(--text-3)',
              fontStyle: 'italic',
            }}
          >
            IA analisando candidato e vaga…
          </div>
        ) : pitchError ? (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--warning-text)',
              padding: '10px 12px',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--r-md)',
            }}
          >
            {pitchError}
          </p>
        ) : pitch ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '20px',
                marginBottom: '20px',
                position: 'relative',
              }}
            >
              <div
                className="it"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '88px',
                  lineHeight: 0.9,
                  color: 'var(--accent-text)',
                  letterSpacing: '-0.04em',
                }}
              >
                {pitch.match_percent}
                <span style={{ fontSize: '32px', marginLeft: '4px' }}>%</span>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-4)',
                    marginBottom: '6px',
                  }}
                >
                  Match com a vaga
                </div>
                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color: 'var(--text-1)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {pitch.pitch}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-1)',
                position: 'relative',
              }}
            >
              <PitchColumn label="Pontos fortes" items={pitch.strengths} variant="green" />
              <PitchColumn label="Gaps" items={pitch.gaps} variant="yellow" />
              <PitchColumn label="Riscos" items={pitch.risks} variant="red" />
            </div>
          </>
        ) : null}
      </div>

      {/* Chat IA — só carrega quando user pede */}
      {!chatEnabled ? (
        <button
          type="button"
          onClick={() => setChatEnabled(true)}
          className="nx-btn nx-btn--glass nx-btn--size-md"
          style={{ alignSelf: 'flex-start' }}
        >
          Pergunte mais à IA sobre {candidateName.split(' ')[0]}
        </button>
      ) : (
        <div
          style={{
            padding: '20px 24px',
            background: 'var(--bg-elev-1)',
            border: '1px solid var(--border-1)',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              marginBottom: '12px',
            }}
          >
            Pergunte à IA sobre {candidateName}
          </div>

          {chatHistory.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {chatHistory.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-2)',
                      fontWeight: 500,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    → {m.q}
                  </div>
                  <div
                    style={{
                      fontSize: '13.5px',
                      color: 'var(--text-1)',
                      lineHeight: 1.6,
                      background: 'var(--bg-elev-2)',
                      padding: '12px 14px',
                      borderRadius: 'var(--r-md)',
                      borderLeft: '2px solid var(--accent-text)',
                    }}
                  >
                    {m.loading ? (
                      <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>
                        IA pensando…
                      </span>
                    ) : (
                      m.a
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault()
              ask(question)
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              placeholder={`Ex: como ${candidateName.split(' ')[0]} se compara com a vaga de ${jobTitle}?`}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              disabled={asking}
              className="nx-input"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              disabled={asking || question.trim().length < 5}
              className="nx-btn nx-btn--primary nx-btn--size-md"
              style={{ flexShrink: 0 }}
            >
              {asking ? 'Pensando…' : 'Perguntar'}
            </button>
          </form>

          {chatHistory.length === 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  disabled={asking}
                  style={{
                    fontSize: '11.5px',
                    padding: '6px 10px',
                    borderRadius: 'var(--r-full)',
                    background: 'var(--bg-elev-2)',
                    border: '1px solid var(--border-1)',
                    color: 'var(--text-2)',
                    cursor: asking ? 'not-allowed' : 'pointer',
                    transition: 'all .15s var(--ease)',
                  }}
                  className="nx-suggested-q"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .nx-suggested-q:hover:not(:disabled) {
          background: var(--accent-bg);
          color: var(--accent-text);
          border-color: var(--accent-border);
        }
      `}</style>

      {candidateTitle ? null : null}
    </div>
  )
}

function PitchColumn({
  label,
  items,
  variant,
}: {
  label: string
  items: string[]
  variant: 'green' | 'yellow' | 'red'
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          marginBottom: '10px',
        }}
      >
        {label}
      </div>
      {items.length === 0 ? (
        <p
          style={{
            fontSize: '12.5px',
            color: 'var(--text-4)',
            fontStyle: 'italic',
          }}
        >
          —
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {items.map((item, i) => (
            <Badge key={i} variant={variant} size="sm">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
