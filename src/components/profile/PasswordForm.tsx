'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'

export default function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (next.length < 8) {
      setError('Nova senha precisa de pelo menos 8 caracteres.')
      return
    }
    if (next !== confirm) {
      setError('Confirmação não confere com a nova senha.')
      return
    }
    if (!current) {
      setError('Informe sua senha atual.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setError('Sessão expirada. Faça login novamente.')
      setLoading(false)
      return
    }

    // Reautentica antes de trocar — garante que quem está pedindo é o dono da senha atual.
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    })
    if (reauthErr) {
      setError('Senha atual incorreta.')
      setLoading(false)
      return
    }

    const { error: upErr } = await supabase.auth.updateUser({ password: next })
    setLoading(false)
    if (upErr) {
      setError(upErr.message || 'Não foi possível trocar a senha.')
      return
    }
    setSuccess(true)
    setCurrent('')
    setNext('')
    setConfirm('')
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
          Trocar senha
        </h2>
        <div className="flex flex-col gap-4">
          <Input
            label="Senha atual"
            type="password"
            value={current}
            onChange={e => {
              setCurrent(e.target.value)
              setSuccess(false)
            }}
            autoComplete="current-password"
            required
          />
          <Input
            label="Nova senha"
            type="password"
            value={next}
            onChange={e => {
              setNext(e.target.value)
              setSuccess(false)
            }}
            autoComplete="new-password"
            required
            hint="Mínimo 8 caracteres."
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirm}
            onChange={e => {
              setConfirm(e.target.value)
              setSuccess(false)
            }}
            autoComplete="new-password"
            required
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
          Senha atualizada.
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Trocar senha
        </Button>
      </div>
    </form>
  )
}
