'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

type Role = 'company_user' | 'recruiter' | 'candidate'

const roleOptions: { value: Role; label: string; description: string }[] = [
  {
    value: 'company_user',
    label: 'Empresa',
    description: 'Quero abrir vagas e contratar',
  },
  {
    value: 'recruiter',
    label: 'Recrutador',
    description: 'Quero enviar candidatos e ganhar por resultado',
  },
  {
    value: 'candidate',
    label: 'Candidato',
    description: 'Quero encontrar oportunidades',
  },
]

export default function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('company_user')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Este email já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    // Atualizar papel na tabela users
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ role, full_name: fullName })
        .eq('id', user.id)
    }

    const redirectMap: Record<Role, string> = {
      company_user: '/empresa',
      recruiter: '/hunter',
      candidate: '/candidato',
    }

    router.push(redirectMap[role])
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome completo"
        type="text"
        placeholder="Seu nome"
        value={fullName}
        onChange={e => setFullName(e.target.value)}
        required
        autoComplete="name"
      />
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
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres"
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#374151]">
          Quero usar a Nexhire como <span className="text-[#16A34A]">*</span>
        </label>
        <div className="flex flex-col gap-2">
          {roleOptions.map(option => (
            <label
              key={option.value}
              className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${role === option.value
                  ? 'border-[#16A34A] bg-[#F0FDF4]'
                  : 'border-[#E5E7EB] hover:border-[#BBF7D0]'
                }
              `}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="mt-0.5 accent-[#16A34A]"
              />
              <div>
                <div className="text-sm font-medium text-[#052E16]">
                  {option.label}
                </div>
                <div className="text-xs text-[#6B7280]">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Criar conta
      </Button>

      <p className="text-sm text-center text-[#6B7280]">
        Já tem conta?{' '}
        <Link href="/login" className="text-[#16A34A] font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}