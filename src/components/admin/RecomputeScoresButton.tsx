'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RecomputeScoresButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/recompute-scores', { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as { processed?: number; error?: string }
      if (!res.ok) {
        setError(data.error || 'Falha ao recalcular.')
      } else {
        setMessage(`${data.processed ?? 0} hunters processados.`)
        router.refresh()
      }
    } catch (err) {
      console.error('[recompute]', err)
      setError('Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="nx-btn nx-btn--glass nx-btn--size-md"
        style={{ flexShrink: 0 }}
      >
        {loading ? 'Recalculando…' : 'Recalcular scores'}
      </button>
      {message && (
        <span
          role="status"
          style={{ fontSize: '12.5px', color: 'var(--accent-text)' }}
        >
          {message}
        </span>
      )}
      {error && (
        <span role="alert" style={{ fontSize: '12.5px', color: 'var(--danger-text)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
