'use client'

import { useCallback, useSyncExternalStore } from 'react'
import Link from 'next/link'

type Role = 'company_user' | 'recruiter' | 'hr_manager' | 'admin' | 'candidate'

const cta: Record<Role, { label: string; href: string } | null> = {
  company_user: { label: 'Crie sua primeira vaga →', href: '/empresa/vagas/nova' },
  recruiter: { label: 'Ver vagas disponíveis →', href: '/hunter/vagas' },
  hr_manager: { label: 'Revisar fila →', href: '/hr/submissoes' },
  admin: { label: 'Visão geral →', href: '/admin' },
  candidate: { label: 'Ver vagas →', href: '/candidato/vagas' },
}

interface WelcomeCardProps {
  role: Role
  userId: string
}

/**
 * Banner enxuto de boas-vindas no primeiro acesso. Compacto, 1 CTA,
 * dispensa persistente em localStorage por usuário.
 */
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

  // SSR: assume dispensado → não renderiza → sem mismatch
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

  const action = cta[role]
  if (!action) return null

  return (
    <div
      role="banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '10px 14px',
        marginBottom: '20px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        fontSize: '13px',
      }}
    >
      <span
        aria-hidden
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--neon)',
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, color: 'var(--text-2)', lineHeight: 1.4 }}>
        Bem-vindo à Nexhire.
      </span>
      <Link
        href={action.href}
        style={{
          color: 'var(--accent-text)',
          fontWeight: 500,
          textDecoration: 'none',
          flexShrink: 0,
        }}
        className="hover:underline"
      >
        {action.label}
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar boas-vindas"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-4)',
          fontSize: '14px',
          cursor: 'pointer',
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}
