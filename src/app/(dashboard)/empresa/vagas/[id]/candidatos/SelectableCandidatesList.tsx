'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDaysSince } from '@/lib/utils'
import type { SubmissionStatus } from '@/types/database'

interface RawSubmission {
  id: string
  status: SubmissionStatus
  submitted_at: string
  sent_to_client_at: string | null
  ai_score: number | null
  ai_summary: string | null
  candidates: { full_name: string; current_title: string | null; location: string | null } | null
  recruiters: { level: string | null; users: { full_name: string | null } | null } | null
}

interface SelectableCandidatesListProps {
  ranked: RawSubmission[]
  jobId: string
}

const statusInfo: Record<string, { label: string; variant: 'gray' | 'yellow' | 'green' | 'blue' | 'dark' | 'red' }> = {
  sent_to_client: { label: 'Aguardando você', variant: 'yellow' },
  client_approved: { label: 'Aprovado por você', variant: 'green' },
  client_rejected: { label: 'Reprovado', variant: 'red' },
  interview_scheduled: { label: 'Em entrevista', variant: 'blue' },
  offer: { label: 'Em proposta', variant: 'dark' },
  hired: { label: 'Contratado', variant: 'dark' },
  not_hired: { label: 'Não contratado', variant: 'gray' },
}

const recruiterLevelLabel: Record<string, string> = {
  beginner: 'Iniciante',
  specialist: 'Especialista',
  top_hunter: 'Top Hunter',
}

function initialsOf(name: string): string {
  return (
    name
      .split(' ')
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '??'
  )
}

function scoreTier(score: number): { ring: string; fill: string; text: string; label: string } {
  if (score >= 75)
    return {
      ring: 'var(--color-g600)',
      fill: 'var(--color-m100)',
      text: 'var(--color-f800)',
      label: 'Forte fit',
    }
  if (score >= 50)
    return {
      ring: 'var(--info-text)',
      fill: 'var(--info-bg)',
      text: 'var(--info-text)',
      label: 'Fit médio',
    }
  return {
    ring: 'var(--warning-text)',
    fill: 'var(--warning-bg)',
    text: 'var(--warning-text)',
    label: 'Fit baixo',
  }
}

const MAX_SELECTION = 4
const MIN_SELECTION = 2

export default function SelectableCandidatesList({
  ranked,
  jobId,
}: SelectableCandidatesListProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [comparing, setComparing] = useState(false)

  const anyScored = ranked.some(s => s.ai_score !== null)
  const topId = anyScored ? ranked[0]?.id : null

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_SELECTION) {
        next.add(id)
      }
      return next
    })
  }

  function startCompare() {
    if (selected.size < MIN_SELECTION) return
    setComparing(true)
    const ids = Array.from(selected).join(',')
    router.push(`/empresa/vagas/${jobId}/candidatos/comparar?ids=${ids}`)
  }

  function clear() {
    setSelected(new Set())
  }

  const canCompare = selected.size >= MIN_SELECTION

  return (
    <>
      <div
        className="flex flex-col gap-2.5"
        style={{ paddingBottom: selected.size > 0 ? '90px' : 0 }}
      >
        {ranked.map((sub, index) => {
          const candidate = sub.candidates
          const recruiter = sub.recruiters
          const status = statusInfo[sub.status] ?? { label: sub.status, variant: 'gray' as const }
          const reference = sub.sent_to_client_at ?? sub.submitted_at
          const isTop = sub.id === topId && sub.ai_score !== null
          const tier = sub.ai_score !== null ? scoreTier(sub.ai_score) : null
          const isSelected = selected.has(sub.id)
          const atMaxAndNotSelected = !isSelected && selected.size >= MAX_SELECTION

          return (
            <div key={sub.id} style={{ position: 'relative' }}>
              {/* Checkbox overlay no canto superior esquerdo */}
              <label
                className="nx-compare-check"
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  zIndex: 2,
                  cursor: atMaxAndNotSelected ? 'not-allowed' : 'pointer',
                  opacity: atMaxAndNotSelected ? 0.3 : 1,
                }}
                onClick={e => e.stopPropagation()}
                title={
                  atMaxAndNotSelected
                    ? `Máximo ${MAX_SELECTION} candidatos por comparação`
                    : isSelected
                      ? 'Remover da comparação'
                      : 'Adicionar à comparação'
                }
              >
                <input
                  type="checkbox"
                  className="nx-checkbox"
                  checked={isSelected}
                  disabled={atMaxAndNotSelected}
                  onChange={() => toggle(sub.id)}
                  aria-label={`Selecionar ${candidate?.full_name ?? 'candidato'} pra comparação`}
                />
              </label>

              <Link
                href={`/empresa/candidatos/${sub.id}`}
                className="kanban-card"
                style={{
                  display: 'block',
                  background: 'var(--bg-elev-1)',
                  border: isSelected
                    ? '1.5px solid var(--accent-text)'
                    : isTop
                      ? '1.5px solid var(--color-g600)'
                      : '1px solid var(--border-1)',
                  borderRadius: 'var(--r-lg)',
                  padding: '16px 20px 16px 48px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                  position: 'relative',
                  boxShadow: isSelected ? 'var(--shadow-2)' : undefined,
                }}
              >
                {isTop && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      left: '48px',
                      background: 'var(--color-f900)',
                      color: 'var(--color-neon)',
                      fontSize: '9.5px',
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      padding: '3px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    Top match
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    aria-hidden
                    style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--color-f900)',
                        color: 'var(--color-neon)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        margin: '6px',
                      }}
                    >
                      {initialsOf(candidate?.full_name ?? '??')}
                    </div>
                    <span
                      className="mono"
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        background: 'var(--bg-elev-1)',
                        color: 'var(--text-1)',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '999px',
                        border: '1px solid var(--border-1)',
                      }}
                    >
                      #{(index + 1).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '14.5px',
                          fontWeight: 600,
                          color: 'var(--text-1)',
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {candidate?.full_name ?? 'Candidato sem nome'}
                      </span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '2px' }}>
                      {candidate?.current_title || 'Cargo não informado'}
                      {candidate?.location && ` · ${candidate.location}`}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-4)',
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {recruiter?.users?.full_name && (
                        <span>
                          Hunter: {recruiter.users.full_name}
                          {recruiter.level && ` · ${recruiterLevelLabel[recruiter.level] ?? recruiter.level}`}
                        </span>
                      )}
                      <span>· Atualizado {formatDaysSince(reference)}</span>
                    </div>
                    {sub.ai_summary && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '8px 10px',
                          background: 'var(--accent-bg)',
                          border: '1px solid var(--accent-border)',
                          borderLeft: '2px solid var(--accent-text)',
                          borderRadius: 'var(--r-sm)',
                          fontSize: '12px',
                          color: 'var(--text-2)',
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9.5px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--accent-text)',
                            fontWeight: 600,
                            marginRight: '6px',
                          }}
                        >
                          Por que IA recomenda:
                        </span>
                        {sub.ai_summary.length > 180
                          ? `${sub.ai_summary.slice(0, 180).trim()}…`
                          : sub.ai_summary}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {sub.ai_score !== null && tier ? (
                      <div
                        aria-label={`AI score ${sub.ai_score} — ${tier.label}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: tier.fill,
                            border: `2px solid ${tier.ring}`,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <span
                            className="it"
                            style={{
                              fontSize: '24px',
                              fontWeight: 400,
                              color: tier.text,
                              lineHeight: 1,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {sub.ai_score}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 600,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: tier.text,
                          }}
                        >
                          {tier.label}
                        </span>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-4)',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          minWidth: '56px',
                        }}
                      >
                        sem análise da IA
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {selected.size > 0 && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text-1)',
            color: 'var(--bg-base)',
            padding: '12px 16px 12px 20px',
            borderRadius: 'var(--r-full)',
            boxShadow: 'var(--shadow-3)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            zIndex: 20,
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="mono"
              style={{
                fontSize: '11px',
                background: 'var(--neon)',
                color: 'var(--green-950)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 700,
              }}
            >
              {selected.size}
            </span>
            {selected.size === 1
              ? 'candidato selecionado · selecione mais 1'
              : `${selected.size} candidatos selecionados`}
          </span>
          <button
            type="button"
            onClick={clear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,.6)',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            limpar
          </button>
          <Button
            type="button"
            size="sm"
            variant="neon"
            disabled={!canCompare || comparing}
            loading={comparing}
            onClick={startCompare}
          >
            Comparar com IA
          </Button>
        </div>
      )}
    </>
  )
}
