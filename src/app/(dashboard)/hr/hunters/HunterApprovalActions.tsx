'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import type { RecruiterStatus } from '@/types/database'

interface HunterApprovalActionsProps {
  recruiterId: string
  currentStatus: RecruiterStatus
}

export default function HunterApprovalActions({
  recruiterId,
  currentStatus,
}: HunterApprovalActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<RecruiterStatus | null>(null)
  const [error, setError] = useState('')

  async function updateStatus(newStatus: RecruiterStatus) {
    setLoading(newStatus)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('recruiters')
      .update({ status: newStatus })
      .eq('id', recruiterId)

    if (updateError) {
      console.error('[hunter:approve]', updateError)
      setError('Não foi possível atualizar. Tente de novo.')
      setLoading(null)
      return
    }

    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {currentStatus !== 'approved' && (
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => updateStatus('approved')}
            loading={loading === 'approved'}
            disabled={loading !== null}
          >
            Aprovar hunter
          </Button>
        )}
        {currentStatus !== 'rejected' && (
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={() => updateStatus('rejected')}
            loading={loading === 'rejected'}
            disabled={loading !== null}
          >
            Rejeitar
          </Button>
        )}
        {currentStatus === 'approved' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateStatus('suspended')}
            loading={loading === 'suspended'}
            disabled={loading !== null}
          >
            Suspender
          </Button>
        )}
        {currentStatus === 'suspended' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateStatus('approved')}
            loading={loading === 'approved'}
            disabled={loading !== null}
          >
            Reativar
          </Button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: '11.5px', color: 'var(--danger-text)' }}>{error}</p>
      )}
    </div>
  )
}
