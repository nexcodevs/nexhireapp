'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

export interface JobFormInitialValues {
  title?: string
  seniority?: string
  location?: string
  work_model?: string
  employment_type?: string
  salary_min?: number | null
  salary_max?: number | null
  description?: string
}

interface JobFormProps {
  companyId: string
  userId: string
  initialValues?: JobFormInitialValues
  aiGenerated?: boolean
}

export default function JobForm({ companyId, userId, initialValues, aiGenerated = false }: JobFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: initialValues?.title ?? '',
    seniority: initialValues?.seniority ?? '',
    area: '',
    location: initialValues?.location ?? '',
    work_model: initialValues?.work_model ?? '',
    employment_type: initialValues?.employment_type ?? '',
    salary_min: initialValues?.salary_min ? String(initialValues.salary_min) : '',
    salary_max: initialValues?.salary_max ? String(initialValues.salary_max) : '',
    description: initialValues?.description ?? '',
    requirements: '',
    deadline_days: '7',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const deadline = new Date()
    deadline.setDate(deadline.getDate() + parseInt(form.deadline_days))

    const { error: jobError } = await supabase
      .from('jobs')
      .insert({
        company_id: companyId,
        title: form.title,
        seniority: form.seniority,
        location: form.location,
        work_model: form.work_model,
        employment_type: form.employment_type,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        description: form.description,
        status: 'pending_hr_review',
        submission_deadline: deadline.toISOString(),
        created_by: userId,
      })

    if (jobError) {
      setError('Erro ao criar vaga. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/empresa/vagas')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {aiGenerated && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--r-md)',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent-text)',
            fontSize: '12.5px',
            fontWeight: 500,
            letterSpacing: '-0.005em',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
          <span>
            Rascunho gerado pela IA a partir do seu brief. Revise tudo antes de publicar.
          </span>
        </div>
      )}

      {/* Informações básicas */}
      <div className="bg-surf rounded-xl border border-(--border-2) p-6">
        <h2 className="text-base font-bold text-text mb-4">Informações básicas</h2>
        <div className="grid gap-4">
          <Input
            label="Título da vaga"
            name="title"
            placeholder="Ex: Engenheiro de Software Sênior"
            value={form.title}
            onChange={handleChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Senioridade"
              name="seniority"
              value={form.seniority}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="Estágio">Estágio</option>
              <option value="Júnior">Júnior</option>
              <option value="Pleno">Pleno</option>
              <option value="Sênior">Sênior</option>
              <option value="Especialista">Especialista</option>
              <option value="Gerente">Gerente</option>
              <option value="Diretor">Diretor</option>
            </Select>
            <Select
              label="Modelo de trabalho"
              name="work_model"
              value={form.work_model}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="Presencial">Presencial</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Remoto">Remoto</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Localização"
              name="location"
              placeholder="Ex: São Paulo, SP"
              value={form.location}
              onChange={handleChange}
              required
            />
            <Select
              label="Tipo de contrato"
              name="employment_type"
              value={form.employment_type}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
              <option value="Estágio">Estágio</option>
              <option value="Freelance">Freelance</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Remuneração */}
      <div className="bg-surf rounded-xl border border-(--border-2) p-6">
        <h2 className="text-base font-bold text-text mb-4">Remuneração</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Salário mínimo (R$)"
            name="salary_min"
            type="number"
            placeholder="Ex: 5000"
            value={form.salary_min}
            onChange={handleChange}
            hint="Opcional"
          />
          <Input
            label="Salário máximo (R$)"
            name="salary_max"
            type="number"
            placeholder="Ex: 8000"
            value={form.salary_max}
            onChange={handleChange}
            hint="Opcional"
          />
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-surf rounded-xl border border-(--border-2) p-6">
        <h2 className="text-base font-bold text-text mb-4">Descrição e requisitos</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text2">
              Descrição da vaga <span className="text-g600">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Descreva as responsabilidades, o contexto da vaga e o que o candidato vai fazer..."
              className="px-3 py-2.5 rounded-lg border border-(--border-2) bg-surf text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-(--accent-text) resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text2">
              Requisitos <span className="text-g600">*</span>
            </label>
            <textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Liste os requisitos obrigatórios e desejáveis..."
              className="px-3 py-2.5 rounded-lg border border-(--border-2) bg-surf text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-(--accent-text) resize-none"
            />
          </div>
        </div>
      </div>

      {/* Configurações */}
      <div className="bg-surf rounded-xl border border-(--border-2) p-6">
        <h2 className="text-base font-bold text-text mb-4">Configurações</h2>
        <div className="max-w-xs">
          <Select
            label="Prazo para envio de candidatos"
            name="deadline_days"
            value={form.deadline_days}
            onChange={handleChange}
          >
            <option value="3">3 dias</option>
            <option value="5">5 dias</option>
            <option value="7">7 dias (padrão)</option>
            <option value="10">10 dias</option>
            <option value="14">14 dias</option>
          </Select>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm rounded-lg px-4 py-3"
          style={{
            color: 'var(--danger-text)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
          }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading} size="lg">
          Publicar vaga para revisão
        </Button>
      </div>
    </form>
  )
}