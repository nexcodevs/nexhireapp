'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import LogoUpload from '@/components/empresa/LogoUpload'

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

interface CompanyEditFormProps {
  companyId: string
  initial: {
    name: string
    website: string
    industry: string
    size: string
    logo_url: string | null
  }
}

export default function CompanyEditForm({ companyId, initial }: CompanyEditFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSuccess(false)
  }

  async function handleLogoUploaded(path: string) {
    setError('')
    const supabase = createClient()
    const { error: upErr } = await supabase
      .from('companies')
      .update({ logo_url: path })
      .eq('id', companyId)
    if (upErr) {
      setError('Logo enviada mas não conseguimos salvar no perfil.')
      return
    }
    update('logo_url', path)
    router.refresh()
  }

  async function handleLogoRemoved() {
    const supabase = createClient()
    if (form.logo_url) {
      await supabase.storage.from('company_logos').remove([form.logo_url])
    }
    const { error: upErr } = await supabase
      .from('companies')
      .update({ logo_url: null })
      .eq('id', companyId)
    if (upErr) {
      setError('Não foi possível remover a logo.')
      return
    }
    update('logo_url', null)
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (form.name.trim().length < 2) {
      setError('Informe o nome da empresa.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: upErr } = await supabase
      .from('companies')
      .update({
        name: form.name.trim(),
        website: form.website.trim() || null,
        industry: form.industry || null,
        size: form.size || null,
      })
      .eq('id', companyId)

    setLoading(false)
    if (upErr) {
      setError(upErr.message || 'Não foi possível salvar.')
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card padding="lg">
        <LogoUpload
          companyId={companyId}
          value={form.logo_url}
          onUploaded={handleLogoUploaded}
          onRemoved={handleLogoRemoved}
          disabled={loading}
        />
      </Card>

      <Card padding="lg">
        <div className="flex flex-col gap-4">
          <Input
            label="Nome da empresa"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            required
          />
          <Input
            label="Site"
            value={form.website}
            onChange={e => update('website', e.target.value)}
            placeholder="acme.com.br"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Setor"
              value={form.industry}
              onChange={e => update('industry', e.target.value)}
            >
              <option value="">—</option>
              {INDUSTRIES.map(i => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
            <Select
              label="Tamanho"
              value={form.size}
              onChange={e => update('size', e.target.value)}
            >
              <option value="">—</option>
              {SIZES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
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
          Salvo.
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}
