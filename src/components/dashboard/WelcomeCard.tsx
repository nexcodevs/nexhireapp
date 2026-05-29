'use client'

import { useCallback, useSyncExternalStore } from 'react'
import Link from 'next/link'

type Role = 'company_user' | 'recruiter' | 'hr_manager' | 'admin' | 'candidate'

interface Step {
  label: string
  href: string
}

const guides: Record<Role, { title: string; subtitle: string; steps: Step[] }> = {
  company_user: {
    title: 'Bem-vindo à Nexhire',
    subtitle: 'Aqui vai um caminho rápido pra você começar a contratar:',
    steps: [
      { label: '1. Configure a logo e dados da empresa', href: '/empresa/configuracoes' },
      { label: '2. Crie sua primeira vaga', href: '/empresa/vagas/nova' },
      { label: '3. Acompanhe candidatos enviados', href: '/empresa/candidatos' },
    ],
  },
  recruiter: {
    title: 'Bem-vindo, hunter',
    subtitle: 'Sua bússola pra começar a enviar candidatos:',
    steps: [
      { label: '1. Veja as vagas disponíveis pra você', href: '/hunter/vagas' },
      { label: '2. Envie seu primeiro candidato', href: '/hunter/vagas' },
      { label: '3. Acompanhe suas submissões', href: '/hunter/submissoes' },
    ],
  },
  hr_manager: {
    title: 'Bem-vindo ao HR',
    subtitle: 'Pontos de partida pra curadoria:',
    steps: [
      { label: '1. Vagas aguardando revisão', href: '/hr/vagas' },
      { label: '2. Submissões pra curar', href: '/hr/submissoes' },
      { label: '3. Pipeline geral', href: '/hr/pipeline' },
    ],
  },
  admin: {
    title: 'Bem-vindo ao painel admin',
    subtitle: 'Visão geral da plataforma:',
    steps: [
      { label: '1. Empresas cadastradas', href: '/admin/empresas' },
      { label: '2. Hunters aprovados/pendentes', href: '/admin/hunters' },
      { label: '3. Consumo de IA', href: '/admin/ai-usage' },
    ],
  },
  candidate: {
    title: 'Bem-vindo',
    subtitle: 'Encontre oportunidades:',
    steps: [{ label: 'Ver vagas abertas', href: '/candidato/vagas' }],
  },
}

interface WelcomeCardProps {
  role: Role
  userId: string
}

export default function WelcomeCard({ role, userId }: WelcomeCardProps) {
  const storageKey = `nx-welcome-dismissed-${userId}`

  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener('storage', cb)
    window.addEventListener('nx-welcome-dismiss', cb)
    return () => {
      window.removeEventListener('storage', cb)
      window.removeEventListener('nx-welcome-dismiss', cb)
    }
  }, [])

  const getSnapshot = useCallback((): boolean => {
    try {
      return window.localStorage.getItem(storageKey) === '1'
    } catch {
      return true
    }
  }, [storageKey])

  // SSR: assume dispensado → não renderiza nada → sem mismatch de hydration
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, () => true)

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, '1')
      window.dispatchEvent(new Event('nx-welcome-dismiss'))
    } catch {
      // ignora
    }
  }

  if (dismissed) return null

  const guide = guides[role]
  if (!guide) return null

  return (
    <div
      style={{
        position: 'relative',
        padding: '20px 24px',
        marginBottom: '20px',
        background:
          'linear-gradient(135deg, var(--bg-elev-1) 0%, var(--bg-elev-2) 100%)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-40%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(0,230,118,.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div className="flex items-start justify-between gap-3" style={{ position: 'relative' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent-text)',
              marginBottom: '6px',
            }}
          >
            Primeiro acesso
          </div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--text-1)',
              marginBottom: '4px',
            }}
          >
            {guide.title}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '14px' }}>
            {guide.subtitle}
          </p>
          <div className="flex flex-col gap-2">
            {guide.steps.map(s => (
              <Link
                key={s.href + s.label}
                href={s.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: 'var(--accent-text)',
                  textDecoration: 'none',
                }}
                className="nx-welcome-step"
              >
                <span>{s.label}</span>
                <span aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar boas-vindas"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-3)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 'var(--r-sm)',
            textDecoration: 'underline',
            flexShrink: 0,
          }}
        >
          dispensar
        </button>
      </div>
      <style>{`
        .nx-welcome-step:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
