'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

const SUGGESTIONS: Record<string, string[]> = {
  company_user: [
    'Quantos candidatos estão me aguardando?',
    'Resume a vaga mais ativa.',
    'Como melhorar o título da minha vaga pra atrair mais hunters?',
  ],
  recruiter: [
    'Quantas vagas combinam com meu perfil?',
    'Minha taxa de aprovação está boa?',
    'O que devo escrever no resumo da entrevista?',
  ],
  hr_manager: [
    'Quais vagas precisam de revisão agora?',
    'Quantas submissões estão pendentes de curadoria?',
    'Qual hunter merece atenção?',
  ],
  admin: [
    'Resumo da plataforma hoje',
    'Quantos hunters ativos?',
    'Quais empresas mais usaram a plataforma esse mês?',
  ],
}

interface NexhireAssistantProps {
  userRole: string
}

export default function NexhireAssistant({ userRole }: NexhireAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Cmd+K / Ctrl+K abre o assistente
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  // Foco no input ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Auto-scroll no final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function send(text: string) {
    const trimmed = text.trim()
    if (trimmed.length < 2 || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const placeholder: Message = { role: 'assistant', content: '', loading: true }

    setMessages(prev => [...prev, userMsg, placeholder])
    setInput('')
    setLoading(true)

    try {
      const conversation = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversation, pageUrl: pathname }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { role: 'assistant', content: data.error || 'Não consegui responder.' }
              : m,
          ),
        )
        return
      }

      const { reply } = (await res.json()) as { reply: string }
      setMessages(prev =>
        prev.map((m, i) => (i === prev.length - 1 ? { role: 'assistant', content: reply } : m)),
      )
    } catch (err) {
      console.warn('[assistant]', err)
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { role: 'assistant', content: 'Falha de rede. Tenta de novo?' }
            : m,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const suggestions = SUGGESTIONS[userRole] ?? SUGGESTIONS.company_user

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir Nexhire AI (Cmd+K)"
          title="Pergunta pra Nexhire AI · Cmd+K"
          className="nx-assistant-fab"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, var(--neon) 0%, var(--green-600) 100%)',
            color: 'var(--green-950)',
            border: 'none',
            boxShadow:
              '0 8px 24px rgba(0,230,118,.4), inset 0 1px 0 rgba(255,255,255,.3)',
            cursor: 'pointer',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform .15s var(--ease)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
        </button>
      )}

      {open && (
        <>
          {/* Backdrop */}
          <div
            role="button"
            aria-label="Fechar assistente"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.35)',
              backdropFilter: 'blur(4px)',
              zIndex: 49,
            }}
          />

          {/* Painel */}
          <aside
            aria-label="Nexhire AI"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '420px',
              maxWidth: '95vw',
              background: 'var(--bg-elev-1)',
              borderLeft: '1px solid var(--border-2)',
              boxShadow: 'var(--shadow-4)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid var(--border-1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                aria-hidden
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, var(--neon) 0%, var(--green-600) 100%)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--green-950)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-1)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  Nexhire AI
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-4)',
                  }}
                >
                  Cmd+K pra abrir · Esc pra fechar
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Mensagens */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {messages.length === 0 ? (
                <div>
                  <p
                    style={{
                      fontSize: '13.5px',
                      color: 'var(--text-2)',
                      lineHeight: 1.55,
                      marginBottom: '16px',
                    }}
                  >
                    Pergunta pra mim o que precisar sobre suas vagas, candidatos,
                    hunters ou a plataforma. Sei o contexto da página em que você está.
                  </p>
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
                    Sugestões
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {suggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="nx-suggested-q"
                        style={{
                          fontSize: '12.5px',
                          padding: '8px 12px',
                          borderRadius: 'var(--r-md)',
                          background: 'var(--bg-elev-2)',
                          border: '1px solid var(--border-1)',
                          color: 'var(--text-2)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all .15s var(--ease)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9.5px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--text-4)',
                      }}
                    >
                      {m.role === 'user' ? 'Você' : 'Nexhire AI'}
                    </div>
                    <div
                      style={{
                        fontSize: '13.5px',
                        color: 'var(--text-1)',
                        lineHeight: 1.55,
                        background:
                          m.role === 'user' ? 'var(--bg-elev-2)' : 'var(--accent-bg)',
                        border:
                          m.role === 'user'
                            ? '1px solid var(--border-1)'
                            : '1px solid var(--accent-border)',
                        borderRadius: 'var(--r-md)',
                        padding: '10px 12px',
                        maxWidth: '95%',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.loading ? (
                        <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>
                          Pensando…
                        </span>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={e => {
                e.preventDefault()
                send(input)
              }}
              style={{
                padding: '12px 16px 16px',
                borderTop: '1px solid var(--border-1)',
                display: 'flex',
                gap: '8px',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Pergunte alguma coisa…"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
                className="nx-input"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={loading || input.trim().length < 2}
                className="nx-btn nx-btn--primary nx-btn--size-md"
                style={{ flexShrink: 0 }}
              >
                Enviar
              </button>
            </form>
          </aside>
        </>
      )}

      <style>{`
        .nx-assistant-fab:hover {
          transform: scale(1.08);
        }
        .nx-suggested-q:hover {
          background: var(--accent-bg) !important;
          color: var(--accent-text) !important;
          border-color: var(--accent-border) !important;
        }
      `}</style>
    </>
  )
}
