'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FormError from '@/components/ui/FormError'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [exchanging, setExchanging] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [exchangeError, setExchangeError] = useState('')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function setupSession() {
      const code = searchParams.get('code')

      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeErr) {
          setExchangeError('Link inválido ou expirado. Solicite um novo email de recuperação.')
          setExchanging(false)
          return
        }
        setSessionReady(true)
        setExchanging(false)
        return
      }

      // Sem código na URL — verifica se já tem sessão ativa (caso o usuário tenha sido logado)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
      } else {
        setExchangeError('Link inválido ou expirado. Solicite um novo email de recuperação.')
      }
      setExchanging(false)
    }

    setupSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Não foi possível atualizar a senha. Tente novamente.')
      setLoading(false)
      return
    }

    // Após atualizar a senha, redireciona pro dashboard correto baseado no role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

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

  if (exchanging) {
    return (
      <p style={{ fontSize: '13.5px', color: 'var(--text-3)' }}>Validando link…</p>
    )
  }

  if (!sessionReady) {
    return (
      <div className="flex flex-col gap-4">
        <FormError>{exchangeError}</FormError>
        <Link
          href="/forgot-password"
          className="text-sm text-center hover:underline"
          style={{ color: 'var(--accent-text)', fontWeight: 500 }}
        >
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nova senha"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      <Input
        label="Confirmar senha"
        type="password"
        placeholder="••••••••"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        required
        autoComplete="new-password"
      />

      {error && <FormError>{error}</FormError>}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Atualizar senha
      </Button>
    </form>
  )
}
