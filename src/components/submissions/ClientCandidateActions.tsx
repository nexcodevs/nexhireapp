'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface ClientCandidateActionsProps {
  submissionId: string
  mode?: 'review' | 'schedule'
}

export default function ClientCandidateActions({
  submissionId,
  mode = 'review',
}: ClientCandidateActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  async function handleAction(action: 'approve' | 'reject' | 'schedule') {
    setLoading(action)
    setError('')

    const supabase = createClient()

    const statusMap = {
      approve: 'client_approved',
      reject: 'client_rejected',
      schedule: 'interview_scheduled',
    }

    const updatePayload: {
      status: string
      client_feedback?: string
      client_reviewed_at?: string
    } = { status: statusMap[action] }
    if (reason && (action === 'approve' || action === 'reject')) {
      updatePayload.client_feedback = reason
      updatePayload.client_reviewed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update(updatePayload)
      .eq('id', submissionId)

    if (updateError) {
      setError('Erro ao atualizar. Tente novamente.')
      setLoading(null)
      return
    }

    // Notifica HR (não bloqueia)
    if (action === 'approve' || action === 'reject') {
      fetch('/api/notifications/decisao-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          decision: action === 'approve' ? 'approved' : 'rejected',
          reason: reason || undefined,
        }),
      }).catch(err => console.warn('Falha email decisão:', err))
    }

    router.refresh()
    setLoading(null)
  }

  if (mode === 'schedule') {
    return (
      <Card padding="md" style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
        <h2 className="text-base font-bold text-text mb-3">Agendar entrevista</h2>
        <p className="text-sm text-muted mb-4">
          Candidato aprovado. Deseja agendar uma entrevista?
        </p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <Button
          onClick={() => handleAction('schedule')}
          loading={loading === 'schedule'}
        >
          Confirmar entrevista
        </Button>
      </Card>
    )
  }

  return (
    <Card padding="md" style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
      <h2 className="text-base font-bold text-text mb-4">Avaliar candidato</h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text2">
            Motivo (opcional)
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="Compartilhe seu feedback sobre este candidato..."
            className="px-3 py-2.5 rounded-lg border border-(--border-2) bg-surf text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-(--accent-text) resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleAction('approve')}
            loading={loading === 'approve'}
            disabled={loading !== null}
          >
            Aprovar para entrevista
          </Button>
          <Button
            variant="danger"
            onClick={() => handleAction('reject')}
            loading={loading === 'reject'}
            disabled={loading !== null}
          >
            Não tem fit
          </Button>
        </div>
      </div>
    </Card>
  )
}