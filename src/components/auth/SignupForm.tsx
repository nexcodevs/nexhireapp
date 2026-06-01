'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

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

interface HunterDecision {
  decision: 'auto_approve' | 'needs_review' | 'reject'
  status: 'approved' | 'pending' | 'rejected'
  reasoning?: string
}

export default function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('company_user')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hunterResult, setHunterResult] = useState<HunterDecision | null>(null)

  // Campos extras do hunter
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [specialties, setSpecialties] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [bio, setBio] = useState('')

  function validateHunterFields(): string | null {
    if (role !== 'recruiter') return null
    if (!/^https?:\/\/(www\.)?linkedin\.com\/in\//i.test(linkedinUrl.trim()))
      return 'Informe seu LinkedIn no formato linkedin.com/in/seu-perfil'
    if (specialties.trim().length < 3) return 'Liste pelo menos 1 especialidade.'
    const years = parseInt(yearsExperience, 10)
    if (Number.isNaN(years) || years < 0 || years > 50)
      return 'Anos de experiência deve ser um número entre 0 e 50.'
    if (bio.trim().length < 40)
      return 'Conta um pouco sobre sua experiência (mínimo 40 caracteres).'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      setLoading(false)
      return
    }

    const hunterError = validateHunterFields()
    if (hunterError) {
      setError(hunterError)
      setLoading(false)
      return
    }

    // Rate limit antes do auth — bloqueia criação em massa
    try {
      const rl = await fetch('/api/auth/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'signup', email }),
      })
      if (!rl.ok) {
        const data = (await rl.json().catch(() => ({}))) as { error?: string }
        setError(data.error || 'Muitos cadastros. Tente novamente em alguns minutos.')
        setLoading(false)
        return
      }
    } catch {
      // fail open
    }

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })

    if (authError) {
      setError(
        authError.message === 'User already registered'
          ? 'Este email já está cadastrado.'
          : 'Erro ao criar conta. Tente novamente.',
      )
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão não criada. Tente fazer login.')
      setLoading(false)
      return
    }

    await supabase
      .from('users')
      .update({ role, full_name: fullName })
      .eq('id', user.id)

    if (role === 'recruiter') {
      const res = await fetch('/api/hunter/auto-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinUrl: linkedinUrl.trim(),
          specialties: specialties
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          yearsExperience: parseInt(yearsExperience, 10),
          bio: bio.trim(),
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error || 'Conta criada, mas não conseguimos avaliar seu perfil. Vamos revisar manualmente.')
        setHunterResult({ decision: 'needs_review', status: 'pending' })
        setLoading(false)
        return
      }

      const result = (await res.json()) as HunterDecision
      setHunterResult(result)
      setLoading(false)
      return
    }

    const redirectMap: Record<Exclude<Role, 'recruiter'>, string> = {
      company_user: '/empresa',
      candidate: '/candidato',
    }
    router.push(redirectMap[role as Exclude<Role, 'recruiter'>])
    router.refresh()
  }

  // Tela de resultado pro hunter (após auto-approve)
  if (hunterResult) {
    const approved = hunterResult.status === 'approved'
    const rejected = hunterResult.status === 'rejected'
    return (
      <div className="flex flex-col gap-4">
        <div
          role="status"
          style={{
            background: approved
              ? 'var(--accent-bg)'
              : rejected
                ? 'var(--danger-bg)'
                : 'var(--warning-bg)',
            border: `1px solid ${approved ? 'var(--accent-border)' : rejected ? 'var(--danger-border)' : 'var(--warning-border)'}`,
            borderRadius: 'var(--r-md)',
            padding: '16px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: approved
                ? 'var(--accent-text)'
                : rejected
                  ? 'var(--danger-text)'
                  : 'var(--warning-text)',
              marginBottom: '6px',
              letterSpacing: '-0.005em',
            }}
          >
            {approved && 'Cadastro aprovado!'}
            {rejected && 'Cadastro não aprovado'}
            {!approved && !rejected && 'Perfil em análise'}
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-2)',
              lineHeight: 1.55,
            }}
          >
            {approved &&
              'Você já pode acessar o marketplace e começar a enviar candidatos.'}
            {rejected &&
              'Detectamos sinais incompatíveis com nossa política. Se acha que houve engano, escreva pra daniel@nexco.cc.'}
            {!approved &&
              !rejected &&
              'Nosso time vai revisar seu cadastro em até 24h. Você recebe um email quando for liberado.'}
          </p>
        </div>

        {approved ? (
          <Button
            type="button"
            size="lg"
            onClick={() => {
              router.push('/hunter')
              router.refresh()
            }}
          >
            Acessar plataforma
          </Button>
        ) : (
          <Link
            href="/login"
            style={{
              fontSize: '13px',
              color: 'var(--accent-text)',
              fontWeight: 500,
              textAlign: 'center',
              textDecoration: 'underline',
            }}
          >
            Voltar para o login
          </Link>
        )}
      </div>
    )
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
        <label className="text-sm font-medium text-text2">
          Quero usar a Nexhire como <span style={{ color: 'var(--accent-text)' }}>*</span>
        </label>
        <div className="flex flex-col gap-2">
          {roleOptions.map(option => (
            <label
              key={option.value}
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all"
              style={
                role === option.value
                  ? { borderColor: 'var(--accent-text)', background: 'var(--accent-bg)' }
                  : { borderColor: 'var(--border-2)' }
              }
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="mt-0.5 accent-(--accent-text)"
              />
              <div>
                <div className="text-sm font-medium text-text">{option.label}</div>
                <div className="text-xs text-muted">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {role === 'recruiter' && (
        <div
          className="flex flex-col gap-4 p-4 rounded-lg"
          style={{
            background: 'var(--bg-elev-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <p style={{ fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.5 }}>
            Pra acelerar sua aprovação, nossa IA vai revisar esses dados agora. Aprovação
            comum em ~10 segundos. Casos borderline vão pra revisão humana.
          </p>
          <Input
            label="LinkedIn"
            type="url"
            placeholder="https://linkedin.com/in/seu-perfil"
            value={linkedinUrl}
            onChange={e => setLinkedinUrl(e.target.value)}
            required
          />
          <Input
            label="Especialidades (separadas por vírgula)"
            type="text"
            placeholder="Ex: Tech, Data, Produto"
            value={specialties}
            onChange={e => setSpecialties(e.target.value)}
            required
            hint="Áreas onde você tem mais experiência fazendo hire."
          />
          <Input
            label="Anos em recrutamento"
            type="number"
            min={0}
            max={50}
            placeholder="Ex: 5"
            value={yearsExperience}
            onChange={e => setYearsExperience(e.target.value)}
            required
          />
          <Textarea
            label="Conta um pouco da sua experiência"
            placeholder="Ex: 5 anos em hire de eng de software, foco em backend Python. Trabalhei na ACME e na BCorp..."
            value={bio}
            onChange={e => setBio(e.target.value)}
            required
            rows={3}
            hint="Mínimo 40 caracteres. Isso vai pro seu perfil público de hunter."
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          style={{
            fontSize: '13px',
            color: 'var(--danger-text)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
          }}
        >
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        {role === 'recruiter' ? 'Criar conta e enviar para análise' : 'Criar conta'}
      </Button>

      <p className="text-sm text-center text-muted">
        Já tem conta?{' '}
        <Link
          href="/login"
          style={{ color: 'var(--accent-text)', fontWeight: 500 }}
          className="hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  )
}
