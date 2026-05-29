'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface UnblockButtonProps {
  blockId: string
}

export default function UnblockButton({ blockId }: UnblockButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleUnblock() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('company_blocked_hunters')
      .delete()
      .eq('id', blockId)

    if (error) {
      console.error('[unblock]', error)
      setLoading(false)
      return
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={handleUnblock}
      loading={loading}
    >
      Desbloquear
    </Button>
  )
}
