'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface JobFormProps {
  companyId: string
  userId: string
}

export default function JobForm({ companyId, userId }: JobFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    seniority: '',
    area: '',
    location: '',
    work_model: '',
    employment_type: '',
    salary_min: '',
    salary_max: '',
    description: '',
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
      {/* Informações básicas */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-base font-bold text-[#052E16] mb-4">Informações básicas</h2>
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
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#374151]">
                Senioridade <span className="text-[#16A34A]">*</span>
              </label>
              <select
                name="seniority"
                value={form.seniority}
                onChange={handleChange}
                required
                className="h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                <option value="">Selecione</option>
                <option value="Estágio">Estágio</option>
                <option value="Júnior">Júnior</option>
                <option value="Pleno">Pleno</option>
                <option value="Sênior">Sênior</option>
                <option value="Especialista">Especialista</option>
                <option value="Gerente">Gerente</option>
                <option value="Diretor">Diretor</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#374151]">
                Modelo de trabalho <span className="text-[#16A34A]">*</span>
              </label>
              <select
                name="work_model"
                value={form.work_model}
                onChange={handleChange}
                required
                className="h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                <option value="">Selecione</option>
                <option value="Presencial">Presencial</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Remoto">Remoto</option>
              </select>
            </div>
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
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#374151]">
                Tipo de contrato <span className="text-[#16A34A]">*</span>
              </label>
              <select
                name="employment_type"
                value={form.employment_type}
                onChange={handleChange}
                required
                className="h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                <option value="">Selecione</option>
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
                <option value="Estágio">Estágio</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Remuneração */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-base font-bold text-[#052E16] mb-4">Remuneração</h2>
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
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-base font-bold text-[#052E16] mb-4">Descrição e requisitos</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#374151]">
              Descrição da vaga <span className="text-[#16A34A]">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Descreva as responsabilidades, o contexto da vaga e o que o candidato vai fazer..."
              className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#16A34A] resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#374151]">
              Requisitos <span className="text-[#16A34A]">*</span>
            </label>
            <textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Liste os requisitos obrigatórios e desejáveis..."
              className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#16A34A] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Configurações */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-base font-bold text-[#052E16] mb-4">Configurações</h2>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#374151]">
            Prazo para envio de candidatos
          </label>
          <select
            name="deadline_days"
            value={form.deadline_days}
            onChange={handleChange}
            className="h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] focus:outline-none focus:ring-2 focus:ring-[#16A34A] max-w-xs"
          >
            <option value="3">3 dias</option>
            <option value="5">5 dias</option>
            <option value="7">7 dias (padrão)</option>
            <option value="10">10 dias</option>
            <option value="14">14 dias</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
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