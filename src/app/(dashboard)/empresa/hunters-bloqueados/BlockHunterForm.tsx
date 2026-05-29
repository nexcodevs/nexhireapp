'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import FormError from '@/components/ui/FormError'

interface BlockHunterFormProps {
  companyId: string
  userId: string
}

export default function BlockHunterForm({ companyId, userId }: BlockHunterFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Acha o hunter pelo email
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (userError || !userRow) {
      setError('Não encontramos hunter com esse email.')
      setLoading(false)
      return
    }

    const { data: recruiterRow, error: recruiterError } = await supabase
      .from('recruiters')
      .select('id')
      .eq('user_id', userRow.id)
      .single()

    if (recruiterError || !recruiterRow) {
      setError('Esse email não é de um hunter cadastrado.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('company_blocked_hunters')
      .insert({
        company_id: companyId,
        recruiter_id: recruiterRow.id,
        reason: reason.trim() || null,
        blocked_by: userId,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Esse hunter já está bloqueado.')
      } else {
        console.error('[block-hunter]', insertError)
        setError('Não foi possível bloquear. Tente novamente.')
      }
      setLoading(false)
      return
    }

    setEmail('')
    setReason('')
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label="Email do hunter"
        type="email"
        placeholder="hunter@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <Textarea
        label="Motivo (opcional)"
        placeholder="Ex: conflito de interesse, qualidade ruim, sócio de concorrente..."
        value={reason}
        onChange={e => setReason(e.target.value)}
        rows={3}
        hint="Fica registrado pra você e pro time da Nexhire."
      />
      {error && <FormError>{error}</FormError>}
      <Button type="submit" loading={loading}>
        Bloquear hunter
      </Button>
    </form>
  )
}
