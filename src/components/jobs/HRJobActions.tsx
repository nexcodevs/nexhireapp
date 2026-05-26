'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface HRJobActionsProps {
  jobId: string
}

export default function HRJobActions({ jobId }: HRJobActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [maxSubmissions, setMaxSubmissions] = useState('3')
  const [error, setError] = useState('')

  async function handleApprove() {
    setLoading('approve')
    setError('')

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'open_for_hunters',
        max_submissions_per_recruiter: parseInt(maxSubmissions),
      })
      .eq('id', jobId)

    if (updateError) {
      setError('Erro ao aprovar vaga.')
      setLoading(null)
      return
    }

    router.refresh()
    setLoading(null)
  }

  async function handleReject() {
    setLoading('reject')
    setError('')

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId)

    if (updateError) {
      setError('Erro ao reprovar vaga.')
      setLoading(null)
      return
    }

    router.push('/hr/vagas')
  }

  return (
    <Card padding="md" className="border-[#BBF7D0] bg-[#F0FDF4]">
      <h2 className="text-base font-bold text-[#052E16] mb-4">
        Revisão da vaga
      </h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#374151]">
            Limite de candidatos por hunter
          </label>
          <select
            value={maxSubmissions}
            onChange={e => setMaxSubmissions(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] focus:outline-none focus:ring-2 focus:ring-[#16A34A] max-w-xs"
          >
            <option value="1">1 candidato</option>
            <option value="2">2 candidatos</option>
            <option value="3">3 candidatos (padrão)</option>
            <option value="5">5 candidatos</option>
            <option value="10">10 candidatos</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#374151]">
            Notas internas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Observações sobre a vaga..."
            className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#16A34A] resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleApprove}
            loading={loading === 'approve'}
            disabled={loading !== null}
          >
            Aprovar e liberar para hunters
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
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