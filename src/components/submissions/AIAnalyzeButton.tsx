'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface AIAnalyzeButtonProps {
  submissionId: string
}

export default function AIAnalyzeButton({ submissionId }: AIAnalyzeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })

      if (!response.ok) {
        throw new Error('Falha na análise')
      }

      router.refresh()
    } catch {
      setError('Erro ao analisar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleAnalyze}
        loading={loading}
        variant="secondary"
        size="sm"
      >
        {loading ? 'Analisando...' : 'Analisar com IA'}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}