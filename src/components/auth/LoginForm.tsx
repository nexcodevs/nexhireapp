'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FormError from '@/components/ui/FormError'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    // Buscar papel do usuário
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role || 'candidate'
    const redirectMap: Record<string, string> = {
      admin: '/hr',
      hr_manager: '/hr',
      company_user: '/empresa',
      recruiter: '/hunter',
      candidate: '/candidato',
    }

    router.push(redirectMap[role] || '/candidato')
    router.refresh()
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
      <Input
        label="Senha"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />

      <div className="flex justify-end -mt-2">
        <Link
          href="/forgot-password"
          className="text-xs hover:underline"
          style={{ color: 'var(--color-g600)', fontWeight: 500 }}
        >
          Esqueci minha senha
        </Link>
      </div>

      {error && <FormError>{error}</FormError>}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Entrar
      </Button>

      <p
        className="text-sm text-center"
        style={{ color: 'var(--color-muted)' }}
      >
        Não tem conta?{' '}
        <Link
          href="/signup"
          className="hover:underline"
          style={{ color: 'var(--color-g600)', fontWeight: 500 }}
        >
          Criar conta
        </Link>
      </p>
    </form>
  )
}
