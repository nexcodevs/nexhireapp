'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (authError) {
      setError('Não foi possível enviar o email. Verifique o endereço e tente novamente.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className="rounded-lg px-4 py-4"
          style={{
            background: 'var(--color-m100)',
            border: '1px solid var(--color-border-g)',
          }}
        >
          <p style={{ fontSize: '13.5px', color: 'var(--color-text)', fontWeight: 500, marginBottom: '4px' }}>
            Email enviado
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text2)', lineHeight: 1.5 }}>
            Se existir uma conta com <strong>{email}</strong>, você vai receber um link para criar uma nova senha em alguns minutos. Verifique também a caixa de spam.
          </p>
        </div>
        <Link href="/login" className="text-sm text-center" style={{ color: 'var(--color-g600)', fontWeight: 500 }}>
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        placeholder="voce@empresa.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Enviar link de recuperação
      </Button>

      <p className="text-sm text-center text-[#6B7280]">
        Lembrou da senha?{' '}
        <Link href="/login" className="text-[#16A34A] font-medium hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  )
}
