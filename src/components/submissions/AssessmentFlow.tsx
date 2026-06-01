'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface AssessmentAnswer {
  question: string
  answer: string
  score?: number
  notes?: string
}

interface AssessmentFlowProps {
  submissionId: string
  candidateName: string
  questions: string[]
  /** Avaliação existente (pra reabrir e editar). */
  existing?: {
    answers: AssessmentAnswer[]
  }
}

/**
 * Aplica avaliação estruturada do candidato usando as perguntas
 * pré-aprovadas da vaga. HR responde + pontua, IA gera score.
 */
export default function AssessmentFlow({
  submissionId,
  candidateName,
  questions,
  existing,
}: AssessmentFlowProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const initialAnswers: AssessmentAnswer[] = questions.map((q, i) => {
    const existingAnswer = existing?.answers[i]
    return {
      question: q,
      answer: existingAnswer?.answer ?? '',
      score: existingAnswer?.score,
      notes: existingAnswer?.notes,
    }
  })

  const [answers, setAnswers] = useState<AssessmentAnswer[]>(initialAnswers)

  function updateAnswer(i: number, patch: Partial<AssessmentAnswer>) {
    setAnswers(prev => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))
  }

  function validate(): string | null {
    const respondidas = answers.filter(a => a.answer.trim().length > 0)
    if (respondidas.length === 0) {
      return 'Responda pelo menos uma pergunta.'
    }
    return null
  }

  async function handleSubmit() {
    setError('')
    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/assess-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          answers: answers.filter(a => a.answer.trim().length > 0),
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        const msg = data.error || 'Não foi possível salvar a avaliação.'
        setError(msg)
        toast.error(msg)
        setLoading(false)
        return
      }

      toast.success('Avaliação concluída. IA gerou score.')
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error('[assessment]', err)
      setError('Falha de rede.')
    } finally {
      setLoading(false)
    }
  }

  if (questions.length === 0) {
    return null
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="md">
        {existing ? 'Refazer avaliação' : `Aplicar avaliação (${questions.length} perguntas)`}
      </Button>

      <Modal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title={`Avaliação · ${candidateName}`}
        subtitle="Use as perguntas pré-aprovadas pela empresa. HR responde + dá nota; IA gera score final."
        maxWidth={820}
      >
        <div className="flex flex-col gap-5">
          {answers.map((a, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-elev-1)',
                border: '1px solid var(--border-1)',
                borderRadius: 'var(--r-md)',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-text)',
                  marginBottom: '6px',
                }}
              >
                Pergunta {i + 1}
              </div>
              <p
                style={{
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: 'var(--text-1)',
                  lineHeight: 1.55,
                  marginBottom: '12px',
                }}
              >
                {a.question}
              </p>

              <textarea
                value={a.answer}
                onChange={e => updateAnswer(i, { answer: e.target.value })}
                rows={3}
                placeholder="Resposta do candidato (resumo)..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '13px',
                  background: 'var(--bg-elev-2)',
                  border: '1px solid var(--border-1)',
                  borderRadius: 'var(--r-sm)',
                  color: 'var(--text-1)',
                  resize: 'vertical',
                  outline: 'none',
                  marginBottom: '10px',
                }}
              />

              <div className="flex items-center gap-3 flex-wrap">
                <label
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-3)',
                    fontWeight: 500,
                  }}
                >
                  Nota:
                </label>
                <div className="flex gap-1">
                  {[0, 2, 4, 6, 8, 10].map(n => {
                    const selected = a.score === n
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => updateAnswer(i, { score: selected ? undefined : n })}
                        style={{
                          width: '28px',
                          height: '28px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          background: selected ? 'var(--accent-text)' : 'var(--bg-elev-2)',
                          color: selected ? 'var(--bg-base)' : 'var(--text-3)',
                          border: `1px solid ${selected ? 'var(--accent-text)' : 'var(--border-1)'}`,
                          borderRadius: 'var(--r-sm)',
                          cursor: 'pointer',
                        }}
                        aria-label={`Nota ${n}`}
                        aria-pressed={selected}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
                <input
                  type="text"
                  value={a.notes ?? ''}
                  onChange={e => updateAnswer(i, { notes: e.target.value })}
                  placeholder="Observações (opcional)"
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    background: 'var(--bg-elev-2)',
                    border: '1px solid var(--border-1)',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--text-1)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          ))}

          {error && (
            <p
              role="alert"
              style={{
                fontSize: '13px',
                color: 'var(--danger-text)',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                padding: '10px 14px',
                borderRadius: 'var(--r-md)',
              }}
            >
              {error}
            </p>
          )}

          <div
            className="flex items-center justify-between"
            style={{
              paddingTop: '14px',
              borderTop: '1px solid var(--border-1)',
            }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={loading} size="lg">
              {loading ? 'Gerando score IA…' : 'Salvar avaliação'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
