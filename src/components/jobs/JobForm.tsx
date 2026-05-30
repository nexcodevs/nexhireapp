'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import ChipsInput from '@/components/ui/ChipsInput'

interface LanguageReq {
  code: string
  name: string
  level: 'básico' | 'intermediário' | 'fluente' | 'nativo'
}

export interface JobFormInitialValues {
  title?: string
  seniority?: string
  location?: string
  work_model?: string
  employment_type?: string
  salary_min?: number | null
  salary_max?: number | null
  description?: string
  required_skills?: string[]
  desired_skills?: string[]
  behavioral_competencies?: string[]
  culture_fit?: string
  languages?: LanguageReq[]
  certifications?: string[]
  benefits?: string[]
  interview_questions?: string[]
}

interface JobFormProps {
  companyId: string
  userId: string
  initialValues?: JobFormInitialValues
  aiGenerated?: boolean
}

const COMMON_LANGUAGES: { code: string; name: string }[] = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'Inglês' },
  { code: 'es', name: 'Espanhol' },
  { code: 'fr', name: 'Francês' },
  { code: 'de', name: 'Alemão' },
]

export default function JobForm({ companyId, userId, initialValues, aiGenerated = false }: JobFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: initialValues?.title ?? '',
    seniority: initialValues?.seniority ?? '',
    location: initialValues?.location ?? '',
    work_model: initialValues?.work_model ?? '',
    employment_type: initialValues?.employment_type ?? '',
    salary_min: initialValues?.salary_min ? String(initialValues.salary_min) : '',
    salary_max: initialValues?.salary_max ? String(initialValues.salary_max) : '',
    description: initialValues?.description ?? '',
    culture_fit: initialValues?.culture_fit ?? '',
    deadline_days: '7',
  })

  const [requiredSkills, setRequiredSkills] = useState<string[]>(initialValues?.required_skills ?? [])
  const [desiredSkills, setDesiredSkills] = useState<string[]>(initialValues?.desired_skills ?? [])
  const [behavioralCompetencies, setBehavioralCompetencies] = useState<string[]>(initialValues?.behavioral_competencies ?? [])
  const [languages, setLanguages] = useState<LanguageReq[]>(
    initialValues?.languages?.length
      ? initialValues.languages
      : [{ code: 'pt', name: 'Português', level: 'nativo' }],
  )
  const [certifications, setCertifications] = useState<string[]>(initialValues?.certifications ?? [])
  const [benefits, setBenefits] = useState<string[]>(initialValues?.benefits ?? [])
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>(initialValues?.interview_questions ?? [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function addLanguage(code: string) {
    const def = COMMON_LANGUAGES.find(l => l.code === code)
    if (!def) return
    if (languages.some(l => l.code === code)) return
    setLanguages([...languages, { code, name: def.name, level: 'intermediário' }])
  }

  function updateLanguage(i: number, patch: Partial<LanguageReq>) {
    setLanguages(languages.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  function removeLanguage(i: number) {
    setLanguages(languages.filter((_, idx) => idx !== i))
  }

  function validate(): string | null {
    if (form.title.trim().length < 3) return 'Título da vaga obrigatório.'
    if (!form.seniority) return 'Selecione a senioridade.'
    if (!form.work_model) return 'Selecione o modelo de trabalho.'
    if (!form.employment_type) return 'Selecione o tipo de contrato.'
    if (!form.location.trim()) return 'Localização obrigatória.'
    if (form.description.trim().length < 30) return 'Descrição da vaga muito curta (mínimo 30 caracteres).'
    if (requiredSkills.length === 0) return 'Inclua ao menos 1 skill obrigatória.'
    if (behavioralCompetencies.length === 0) return 'Inclua ao menos 1 competência comportamental.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const v = validate()
    if (v) {
      setError(v)
      toast.error(v)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + parseInt(form.deadline_days))

    const { error: jobError } = await supabase
      .from('jobs')
      .insert({
        company_id: companyId,
        title: form.title.trim(),
        seniority: form.seniority,
        location: form.location.trim(),
        work_model: form.work_model,
        employment_type: form.employment_type,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        description: form.description.trim(),
        required_skills: requiredSkills,
        desired_skills: desiredSkills,
        behavioral_competencies: behavioralCompetencies,
        culture_fit: form.culture_fit.trim() || null,
        languages,
        certifications,
        benefits,
        interview_questions: interviewQuestions,
        status: 'pending_hr_review',
        submission_deadline: deadline.toISOString(),
        created_by: userId,
      })

    if (jobError) {
      console.error('[job-form]', jobError)
      setError(jobError.message || 'Erro ao criar vaga. Tente novamente.')
      toast.error('Não foi possível criar a vaga.')
      setLoading(false)
      return
    }

    toast.success('Vaga criada. Está em revisão pelo HR.')
    router.push('/empresa/vagas')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          <span aria-hidden style={{ fontSize: '14px' }}>✨</span>
          <span>
            Rascunho gerado pela IA. Revise cada bloco antes de enviar.
          </span>
        </div>
      )}

      <Section title="Informações básicas">
        <Input
          label="Título da vaga"
          name="title"
          placeholder="Ex: Engenheiro de Software Sênior"
          value={form.title}
          onChange={handleChange}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Senioridade" name="seniority" value={form.seniority} onChange={handleChange} required>
            <option value="">Selecione</option>
            <option value="Estágio">Estágio</option>
            <option value="Júnior">Júnior</option>
            <option value="Pleno">Pleno</option>
            <option value="Sênior">Sênior</option>
            <option value="Especialista">Especialista</option>
            <option value="Gerente">Gerente</option>
            <option value="Diretor">Diretor</option>
          </Select>
          <Select label="Modelo de trabalho" name="work_model" value={form.work_model} onChange={handleChange} required>
            <option value="">Selecione</option>
            <option value="Presencial">Presencial</option>
            <option value="Híbrido">Híbrido</option>
            <option value="Remoto">Remoto</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Localização" name="location" placeholder="São Paulo, SP" value={form.location} onChange={handleChange} required />
          <Select label="Tipo de contrato" name="employment_type" value={form.employment_type} onChange={handleChange} required>
            <option value="">Selecione</option>
            <option value="CLT">CLT</option>
            <option value="PJ">PJ</option>
            <option value="Estágio">Estágio</option>
            <option value="Freelance">Freelance</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Salário mínimo (R$)" name="salary_min" type="number" placeholder="5000" value={form.salary_min} onChange={handleChange} />
          <Input label="Salário máximo (R$)" name="salary_max" type="number" placeholder="8000" value={form.salary_max} onChange={handleChange} />
        </div>
      </Section>

      <Section title="Contexto" subtitle="Resumo do que a vaga é. Os requisitos vão em campos separados abaixo.">
        <Textarea
          label="Descrição da vaga"
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={5}
          placeholder="Contexto da vaga, missão do time, o que o candidato vai entregar..."
          hint="80-200 palavras. Sem requisitos — eles ficam nos campos estruturados."
        />
      </Section>

      <Section title="Perfil técnico" subtitle="Skills obrigatórias vs desejáveis. Hunters e IA usam isso pra avaliar fit.">
        <ChipsInput
          label="Skills obrigatórias"
          value={requiredSkills}
          onChange={setRequiredSkills}
          placeholder="Ex: Python, AWS, PostgreSQL"
          tone="accent"
          hint="Hard skills que NÃO podem faltar. 5-8 idealmente."
          max={12}
        />
        <ChipsInput
          label="Skills desejáveis"
          value={desiredSkills}
          onChange={setDesiredSkills}
          placeholder="Ex: Kubernetes, Terraform"
          tone="neutral"
          hint="Plus, não obrigatório. Sobe o candidato no ranking se tiver."
          max={10}
        />
      </Section>

      <Section title="Perfil comportamental" subtitle="Soft skills e fit cultural.">
        <ChipsInput
          label="Competências comportamentais"
          value={behavioralCompetencies}
          onChange={setBehavioralCompetencies}
          placeholder="Ex: Liderança técnica, Autonomia"
          tone="accent"
          hint="Soft skills críticas. 3-5 itens."
          max={8}
        />
        <Textarea
          label="Fit cultural (opcional)"
          name="culture_fit"
          value={form.culture_fit}
          onChange={handleChange}
          rows={3}
          placeholder="Ex: Time pequeno e enxuto. Cultura de ownership extremo. Valoriza pessoas que escrevem bem e questionam decisões."
          hint="1-2 frases sobre valores e ambiente do time."
        />
      </Section>

      <Section title="Idiomas">
        <div className="flex flex-col gap-2">
          {languages.map((lang, i) => (
            <div
              key={`${lang.code}-${i}`}
              className="flex items-center gap-2"
              style={{
                padding: '10px 12px',
                background: 'var(--bg-elev-1)',
                border: '1px solid var(--border-1)',
                borderRadius: 'var(--r-md)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', flex: 1 }}>
                {lang.name}
              </span>
              <select
                value={lang.level}
                onChange={e => updateLanguage(i, { level: e.target.value as LanguageReq['level'] })}
                style={{
                  padding: '6px 10px',
                  fontSize: '12.5px',
                  background: 'var(--bg-elev-2)',
                  border: '1px solid var(--border-1)',
                  borderRadius: 'var(--r-sm)',
                  color: 'var(--text-1)',
                }}
              >
                <option value="básico">Básico</option>
                <option value="intermediário">Intermediário</option>
                <option value="fluente">Fluente</option>
                <option value="nativo">Nativo</option>
              </select>
              <button
                type="button"
                onClick={() => removeLanguage(i)}
                aria-label={`Remover ${lang.name}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-4)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '16px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <select
              onChange={e => {
                if (e.target.value) {
                  addLanguage(e.target.value)
                  e.target.value = ''
                }
              }}
              defaultValue=""
              style={{
                padding: '8px 10px',
                fontSize: '12.5px',
                background: 'var(--bg-elev-1)',
                border: '1px solid var(--border-1)',
                borderRadius: 'var(--r-md)',
                color: 'var(--text-1)',
              }}
            >
              <option value="">+ Adicionar idioma</option>
              {COMMON_LANGUAGES.filter(l => !languages.some(ll => ll.code === l.code)).map(l => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section title="Certificações desejadas (opcional)">
        <ChipsInput
          label="Certificações"
          value={certifications}
          onChange={setCertifications}
          placeholder="Ex: AWS Solutions Architect, PMP"
          tone="neutral"
          max={6}
        />
      </Section>

      <Section title="Benefícios">
        <ChipsInput
          label="Pacote de benefícios"
          value={benefits}
          onChange={setBenefits}
          placeholder="Ex: VR R$30/dia, Plano de saúde, Stock options"
          tone="accent"
          hint="O que a empresa oferece além do salário. Aparece no card da vaga."
          max={12}
        />
      </Section>

      <Section title="Perguntas pra entrevista" subtitle="Perguntas que o HR vai aplicar — pré-aprovadas por você.">
        <ChipsInput
          label="Perguntas pré-aprovadas"
          value={interviewQuestions}
          onChange={setInterviewQuestions}
          placeholder="Ex: Conte sobre um projeto onde você teve que liderar uma decisão técnica controversa"
          tone="neutral"
          hint="5-7 perguntas cobrindo técnico + comportamental. Apertar Enter pra adicionar."
          max={12}
        />
      </Section>

      <Section title="Configurações">
        <div className="max-w-xs">
          <Select
            label="Prazo de envios"
            name="deadline_days"
            value={form.deadline_days}
            onChange={handleChange}
            hint="Após esse prazo a vaga fecha pra novos envios."
          >
            <option value="3">3 dias</option>
            <option value="5">5 dias</option>
            <option value="7">7 dias (padrão)</option>
            <option value="10">10 dias</option>
            <option value="14">14 dias</option>
          </Select>
        </div>
      </Section>

      {error && (
        <p
          role="alert"
          style={{
            fontSize: '13px',
            color: 'var(--danger-text)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            padding: '10px 14px',
            borderRadius: 'var(--r-md)',
          }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} size="lg">
          Publicar vaga pra revisão
        </Button>
      </div>
    </form>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-md)',
        padding: '18px 20px',
      }}
    >
      <h2
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-1)',
          letterSpacing: '-0.005em',
          marginBottom: subtitle ? '4px' : '14px',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '14px', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}
