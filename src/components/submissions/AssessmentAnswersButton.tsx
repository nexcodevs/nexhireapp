'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

export interface AssessmentAnswer {
  question: string
  answer: string
  score?: number
  notes?: string
}

interface AssessmentAnswersButtonProps {
  answers: AssessmentAnswer[]
  candidateName?: string
}

/**
 * Botão "Ver respostas" + modal mostrando cada pergunta da avaliação
 * com resposta, nota e observação do HR. Usado dentro do card de resultado
 * pra que HR e empresa possam revisar a entrevista.
 */
export default function AssessmentAnswersButton({
  answers,
  candidateName,
}: AssessmentAnswersButtonProps) {
  const [open, setOpen] = useState(false)

  if (!answers || answers.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--accent-text)',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Ver respostas ({answers.length})
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={candidateName ? `Respostas · ${candidateName}` : 'Respostas da avaliação'}
        subtitle="O que o HR coletou na entrevista estruturada."
        maxWidth={760}
      >
        <div className="flex flex-col gap-4">
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
                {typeof a.score === 'number' && (
                  <span
                    style={{
                      marginLeft: '10px',
                      color: 'var(--text-3)',
                      fontWeight: 500,
                    }}
                  >
                    · nota {a.score}/10
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: 'var(--text-1)',
                  lineHeight: 1.55,
                  marginBottom: '10px',
                }}
              >
                {a.question}
              </p>
              <p
                style={{
                  fontSize: '13px',
                  color: a.answer ? 'var(--text-2)' : 'var(--text-4)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {a.answer || 'Sem resposta registrada.'}
              </p>
              {a.notes && (
                <p
                  style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px dashed var(--border-1)',
                    fontSize: '12px',
                    color: 'var(--text-3)',
                    fontStyle: 'italic',
                  }}
                >
                  Obs: {a.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}
