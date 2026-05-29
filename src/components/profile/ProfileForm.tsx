'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'

interface ProfileFormProps {
  initial: {
    full_name: string
    email: string
  }
}

export default function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initial.full_name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (fullName.trim().length < 2) {
      setError('Informe seu nome.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão expirada. Faça login novamente.')
      setLoading(false)
      return
    }
    const { error: upErr } = await supabase
      .from('users')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)
    setLoading(false)
    if (upErr) {
      setError(upErr.message || 'Não foi possível salvar.')
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card padding="lg">
        <h2
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            marginBottom: '14px',
          }}
        >
          Dados básicos
        </h2>
        <div className="flex flex-col gap-4">
          <Input
            label="Nome completo"
            value={fullName}
            onChange={e => {
              setFullName(e.target.value)
              setSuccess(false)
            }}
            required
          />
          <Input
            label="Email"
            value={initial.email}
            disabled
            hint="Email é usado pra login e não pode ser alterado aqui. Fale com o suporte se precisar trocar."
          />
        </div>
      </Card>

      {error && <FormError>{error}</FormError>}
      {success && (
        <div
          role="status"
          style={{
            fontSize: '13px',
            color: 'var(--accent-text)',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            padding: '10px 14px',
            borderRadius: 'var(--r-md)',
          }}
        >
          Nome atualizado.
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Salvar nome
        </Button>
      </div>
    </form>
  )
}
