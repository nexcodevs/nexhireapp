'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PublicJobsSearchProps {
  initialQuery: string
}

/**
 * Input de busca textual pra /vagas público.
 * Persiste em ?q=... sem perder outros filtros. Debounce 400ms na navegação.
 */
export default function PublicJobsSearch({ initialQuery }: PublicJobsSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialQuery)
  const [, startTransition] = useTransition()

  // Sincroniza se URL mudar externamente (ex: navegação)
  useEffect(() => {
    setValue(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (value === initialQuery) return
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim().length >= 2) {
        params.set('q', value.trim())
      } else {
        params.delete('q')
      }
      const next = params.toString()
      startTransition(() => {
        router.replace(`/vagas${next ? `?${next}` : ''}`, { scroll: false })
      })
    }, 400)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Buscar por título ou descrição (ex: Backend Python, Designer Sênior)"
        aria-label="Buscar vagas"
        style={{
          width: '100%',
          padding: '12px 16px 12px 40px',
          fontSize: '14px',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-md)',
          color: 'var(--text-1)',
          outline: 'none',
        }}
      />
      <svg
        aria-hidden
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-4)',
          pointerEvents: 'none',
        }}
      >
        <circle cx="11" cy="11" r="7.5" />
        <path d="m21 21-4.4-4.4" />
      </svg>
    </div>
  )
}
