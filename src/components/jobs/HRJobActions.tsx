'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface HRJobActionsProps {
  jobId: string
}

type VisibilityOption = 'open' | 'specialist_plus' | 'top_hunters_only'

export default function HRJobActions({ jobId }: HRJobActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [maxSubmissions, setMaxSubmissions] = useState('3')
  const [visibility, setVisibility] = useState<VisibilityOption>('open')
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
        visibility_type: visibility,
      })
      .eq('id', jobId)

    if (updateError) {
      setError('Erro ao aprovar vaga.')
      setLoading(null)
      return
    }

    // Notifica hunters elegíveis (não bloqueia o fluxo)
    fetch('/api/notifications/vaga-liberada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    }).catch(err => console.warn('Falha email vaga liberada:', err))

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
    <Card padding="md" style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
      <h2 className="text-base font-bold text-text mb-4">
        Revisão da vaga
      </h2>

      <div className="flex flex-col gap-4">
        {/* Visibilidade */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text2">
            Visibilidade da vaga
          </label>
          <div className="flex flex-col gap-2">
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              visibility === 'open' ? 'border-(--accent-text) bg-surf' : 'border-(--border-2) bg-surf hover:border-(--accent-border)'
            }`}>
              <input
                type="radio"
                name="visibility"
                value="open"
                checked={visibility === 'open'}
                onChange={() => setVisibility('open')}
                className="mt-0.5 accent-(--accent-text)"
              />
              <div>
                <div className="text-sm font-medium text-text">Aberta para todos</div>
                <div className="text-xs text-muted">Todos os hunters aprovados podem enviar candidatos.</div>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              visibility === 'specialist_plus' ? 'border-(--accent-text) bg-surf' : 'border-(--border-2) bg-surf hover:border-(--accent-border)'
            }`}>
              <input
                type="radio"
                name="visibility"
                value="specialist_plus"
                checked={visibility === 'specialist_plus'}
                onChange={() => setVisibility('specialist_plus')}
                className="mt-0.5 accent-(--accent-text)"
              />
              <div>
                <div className="text-sm font-medium text-text">Especialistas e Top Hunters</div>
                <div className="text-xs text-muted">Esconde a vaga dos hunters Iniciantes.</div>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              visibility === 'top_hunters_only' ? 'border-(--accent-text) bg-surf' : 'border-(--border-2) bg-surf hover:border-(--accent-border)'
            }`}>
              <input
                type="radio"
                name="visibility"
                value="top_hunters_only"
                checked={visibility === 'top_hunters_only'}
                onChange={() => setVisibility('top_hunters_only')}
                className="mt-0.5 accent-(--accent-text)"
              />
              <div>
                <div className="text-sm font-medium text-text">Top Hunters apenas</div>
                <div className="text-xs text-muted">Vaga exclusiva — só Top Hunters veem.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Limite */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text2">
            Limite de candidatos por hunter
          </label>
          <select
            value={maxSubmissions}
            onChange={e => setMaxSubmissions(e.target.value)}
            className="h-10 px-3 rounded-lg border border-(--border-2) bg-surf text-sm text-text focus:outline-none focus:ring-2 focus:ring-(--accent-text) max-w-xs"
          >
            <option value="1">1 candidato</option>
            <option value="2">2 candidatos</option>
            <option value="3">3 candidatos (padrão)</option>
            <option value="5">5 candidatos</option>
            <option value="10">10 candidatos</option>
          </select>
        </div>

        {/* Notas */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text2">
            Notas internas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Observações sobre a vaga..."
            className="px-3 py-2.5 rounded-lg border border-(--border-2) bg-surf text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-(--accent-text) resize-none"
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