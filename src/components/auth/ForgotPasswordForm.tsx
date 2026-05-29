'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FormError from '@/components/ui/FormError'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      }),
    })

    setLoading(false)

    if (res.status === 429) {
      setError('Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.')
      return
    }

    if (!res.ok) {
      setError('Não foi possível enviar o email. Verifique o endereço e tente novamente.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <div
          role="status"
          style={{
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
            padding: '14px 16px',
          }}
        >
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-1)',
              fontWeight: 600,
              marginBottom: '4px',
              letterSpacing: '-0.005em',
            }}
          >
            Email enviado
          </p>
          <p style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55 }}>
            Se existir uma conta com <strong>{email}</strong>, você vai receber um link para criar uma nova senha em alguns minutos. Verifique também a caixa de spam.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm text-center hover:underline"
          style={{ color: 'var(--accent-text)', fontWeight: 500 }}
        >
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

      {error && <FormError>{error}</FormError>}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Enviar link de recuperação
      </Button>

      <p
        className="text-sm text-center"
        style={{ color: 'var(--text-3)' }}
      >
        Lembrou da senha?{' '}
        <Link
          href="/login"
          className="hover:underline"
          style={{ color: 'var(--accent-text)', fontWeight: 500 }}
        >
          Voltar para o login
        </Link>
      </p>
    </form>
  )
}
