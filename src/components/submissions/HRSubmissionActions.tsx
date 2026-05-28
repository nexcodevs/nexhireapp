'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface HRSubmissionActionsProps {
  submissionId: string
  jobId: string
  mode?: 'review' | 'send'
}

export default function HRSubmissionActions({
  submissionId,
  jobId,
  mode = 'review',
}: HRSubmissionActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  async function handleAction(action: 'approve' | 'reject' | 'send') {
    setLoading(action)
    setError('')

    const supabase = createClient()

    const statusMap = {
      approve: 'hr_approved',
      reject: 'hr_rejected',
      send: 'sent_to_client',
    }

    const updatePayload: any = { status: statusMap[action] }
    // Salva notas no banco quando há texto
    if (notes && (action === 'approve' || action === 'reject')) {
      updatePayload.hr_notes = notes
      updatePayload.hr_reviewed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update(updatePayload)
      .eq('id', submissionId)

    if (updateError) {
      setError('Erro ao atualizar status.')
      setLoading(null)
      return
    }

    // Dispara email pro cliente quando HR envia pra ele
    if (action === 'send') {
      fetch('/api/notifications/candidato-enviado-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      }).catch(err => console.warn('Falha email cliente:', err))
    }

    router.refresh()
    setLoading(null)
  }

  if (mode === 'send') {
    return (
      <Card padding="md" className="border-[#BBF7D0] bg-[#F0FDF4]">
        <h2 className="text-base font-bold text-[#052E16] mb-3">Enviar para cliente</h2>
        <p className="text-sm text-[#6B7280] mb-4">
          Este candidato foi aprovado. Deseja enviá-lo para o cliente avaliar?
        </p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <Button
          onClick={() => handleAction('send')}
          loading={loading === 'send'}
        >
          Enviar para cliente
        </Button>
      </Card>
    )
  }

  return (
    <Card padding="md" className="border-[#BBF7D0] bg-[#F0FDF4]">
      <h2 className="text-base font-bold text-[#052E16] mb-4">Curadoria</h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#374151]">
            Notas internas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Observações sobre o candidato para registro interno..."
            className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#16A34A] resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleAction('approve')}
            loading={loading === 'approve'}
            disabled={loading !== null}
          >
            Aprovar candidato
          </Button>
          <Button
            variant="danger"
            onClick={() => handleAction('reject')}
            loading={loading === 'reject'}
            disabled={loading !== null}
          >
            Reprovar
          </Button>
        </div>
      </div>
    </Card>
  )
}