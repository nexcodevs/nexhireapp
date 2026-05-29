'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'

const PLACEHOLDERS = [
  'Ex: Python sênior remoto com foco em recommendation systems',
  'Ex: Frontend pleno em React, vagas até R$ 10k',
  'Ex: Liderança técnica em scale-up, presencial SP',
  'Ex: ML engineer com MLOps e cloud GCP',
]

export default function SemanticJobSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const initialQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQ)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const placeholder = PLACEHOLDERS[Math.floor(new Date().getDate() % PLACEHOLDERS.length)]

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const q = query.trim()
    if (q.length < 3) {
      setError('Descreva o tipo de vaga (mínimo 3 caracteres).')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/hunter/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error || 'Busca falhou. Tente reformular.')
        setLoading(false)
        return
      }
      const { jobIds } = (await res.json()) as { jobIds: string[] }
      const sp = new URLSearchParams(searchParams.toString())
      sp.set('q', q)
      sp.set('ids', jobIds.join(','))
      startTransition(() => {
        router.push(`?${sp.toString()}`, { scroll: false })
      })
    } catch (err) {
      console.warn('[semantic-search]', err)
      setError('Falha de rede.')
    } finally {
      setLoading(false)
    }
  }

  function clearSearch() {
    const sp = new URLSearchParams(searchParams.toString())
    sp.delete('q')
    sp.delete('ids')
    setQuery('')
    startTransition(() => {
      router.push(sp.toString() ? `?${sp.toString()}` : '?', { scroll: false })
    })
  }

  const hasActiveSearch = !!searchParams.get('ids')

  return (
    <div
      style={{
        padding: '18px 20px',
        background:
          'linear-gradient(135deg, var(--bg-elev-1) 0%, var(--bg-elev-2) 100%)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-xl)',
        marginBottom: '20px',
        position: 'relative',
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
          background: 'radial-gradient(circle, rgba(0,230,118,.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--accent-text)',
          position: 'relative',
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
        Busca com IA
      </div>

      <form
        onSubmit={handleSearch}
        style={{ display: 'flex', gap: '8px', position: 'relative' }}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
          className="nx-input"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 3}
          className="nx-btn nx-btn--primary nx-btn--size-md"
          style={{ flexShrink: 0 }}
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
        {hasActiveSearch && (
          <Button type="button" variant="outline" size="md" onClick={clearSearch}>
            Limpar
          </Button>
        )}
      </form>

      {error && (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--danger-text)',
            marginTop: '8px',
          }}
        >
          {error}
        </p>
      )}

      {hasActiveSearch && !error && (
        <p
          style={{
            fontSize: '11.5px',
            color: 'var(--text-4)',
            marginTop: '8px',
            position: 'relative',
          }}
        >
          Mostrando vagas ranqueadas por similaridade com sua busca.
        </p>
      )}
    </div>
  )
}
