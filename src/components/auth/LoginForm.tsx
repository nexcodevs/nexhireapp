'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Entrar
      </Button>

      <p className="text-sm text-center text-[#6B7280]">
        Não tem conta?{' '}
        <Link href="/signup" className="text-[#16A34A] font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  )
}
