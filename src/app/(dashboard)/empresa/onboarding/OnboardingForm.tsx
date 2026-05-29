'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import FormError from '@/components/ui/FormError'

const INDUSTRIES = [
  'Tecnologia / SaaS',
  'Fintech',
  'E-commerce',
  'Saúde',
  'Educação',
  'Indústria',
  'Varejo',
  'Serviços',
  'Consultoria',
  'Startup',
  'Outro',
]

const SIZES = [
  { value: '1-10', label: '1 a 10 funcionários' },
  { value: '11-50', label: '11 a 50 funcionários' },
  { value: '51-200', label: '51 a 200 funcionários' },
  { value: '201-1000', label: '201 a 1.000 funcionários' },
  { value: '1000+', label: 'Mais de 1.000 funcionários' },
]

const TOS_VERSION = '2026-05-29'

interface OnboardingFormProps {
  userId: string
  userName: string
}

export default function OnboardingForm({ userId, userName }: OnboardingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    tosAccepted: false,
  })

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function validate(): string | null {
    if (form.name.trim().length < 2) return 'Informe o nome da empresa.'
    if (!form.industry) return 'Selecione o setor da empresa.'
    if (!form.size) return 'Selecione o tamanho da empresa.'
    if (!form.tosAccepted)
      return 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    setLoading(true)
    const supabase = createClient()

    const companyId = crypto.randomUUID()
    const { error: companyError } = await supabase.from('companies').insert({
      id: companyId,
      name: form.name.trim(),
      website: form.website.trim() || null,
      industry: form.industry,
      size: form.size,
    })

    if (companyError) {
      console.error('[onboarding:company]', companyError)
      setError(
        companyError.message ||
          'Não foi possível criar a empresa. Tente novamente em instantes.',
      )
      setLoading(false)
      return
    }

    const { error: linkError } = await supabase.from('company_users').insert({
      company_id: companyId,
      user_id: userId,
      role: 'owner',
      tos_accepted_at: new Date().toISOString(),
      tos_version: TOS_VERSION,
    })

    if (linkError) {
      console.error('[onboarding:link]', linkError)
      setError(linkError.message || 'Não conseguimos vincular você à empresa.')
      setLoading(false)
      return
    }

    router.push('/empresa')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card padding="lg">
        <div className="flex flex-col gap-4">
          <Input
            label="Nome da empresa"
            placeholder="Ex: Acme Tecnologia"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Site da empresa"
            placeholder="acme.com.br"
            value={form.website}
            onChange={e => update('website', e.target.value)}
            hint="Opcional — ajuda hunters a entender o contexto da vaga."
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Setor"
              value={form.industry}
              onChange={e => update('industry', e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {INDUSTRIES.map(i => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
            <Select
              label="Tamanho do time"
              value={form.size}
              onChange={e => update('size', e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {SIZES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card padding="md" variant="flat">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <input
            id="tos-accept"
            type="checkbox"
            className="nx-checkbox"
            checked={form.tosAccepted}
            onChange={e => update('tosAccepted', e.target.checked)}
            style={{ marginTop: '2px' }}
          />
          <label
            htmlFor="tos-accept"
            style={{
              fontSize: '13px',
              color: 'var(--text-2)',
              lineHeight: 1.55,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            Eu, <strong>{userName || 'usuário'}</strong>, declaro ter lido e concordo com os{' '}
            <Link
              href="/termos"
              target="_blank"
              style={{ color: 'var(--accent-text)', fontWeight: 500, textDecoration: 'underline' }}
            >
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link
              href="/privacidade"
              target="_blank"
              style={{ color: 'var(--accent-text)', fontWeight: 500, textDecoration: 'underline' }}
            >
              Política de Privacidade
            </Link>{' '}
            da Nexhire.
          </label>
        </div>
      </Card>

      {error && <FormError>{error}</FormError>}

      <div className="flex justify-end">
        <Button type="submit" loading={loading} size="lg">
          Configurar e continuar
        </Button>
      </div>
    </form>
  )
}
