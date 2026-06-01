import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface LanguageReq {
  code: string
  name: string
  level: string
}

interface CreateJobInput {
  companyId: string
  title: string
  seniority: string
  location: string
  work_model: string
  employment_type: string
  salary_min: number | null
  salary_max: number | null
  description: string
  required_skills: string[]
  desired_skills: string[]
  behavioral_competencies: string[]
  culture_fit: string | null
  languages: LanguageReq[]
  certifications: string[]
  benefits: string[]
  interview_questions: string[]
  deadline_days: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = (await request.json()) as Partial<CreateJobInput>

    const companyId = body.companyId
    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json({ error: 'Empresa inválida.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: companyUser } = await admin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!companyUser) {
      return NextResponse.json(
        { error: 'Você não tem permissão pra criar vagas dessa empresa.' },
        { status: 403 },
      )
    }

    const deadlineDays = typeof body.deadline_days === 'number' && body.deadline_days > 0 ? body.deadline_days : 7
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + deadlineDays)

    const { error: jobError } = await admin.from('jobs').insert({
      company_id: companyId,
      title: body.title ?? '',
      seniority: body.seniority ?? null,
      location: body.location ?? null,
      work_model: body.work_model ?? null,
      employment_type: body.employment_type ?? null,
      salary_min: body.salary_min ?? null,
      salary_max: body.salary_max ?? null,
      description: body.description ?? null,
      required_skills: body.required_skills ?? [],
      desired_skills: body.desired_skills ?? [],
      behavioral_competencies: body.behavioral_competencies ?? [],
      culture_fit: body.culture_fit ?? null,
      languages: body.languages ?? [],
      certifications: body.certifications ?? [],
      benefits: body.benefits ?? [],
      interview_questions: body.interview_questions ?? [],
      status: 'pending_hr_review',
      submission_deadline: deadline.toISOString(),
      created_by: user.id,
    })

    if (jobError) {
      console.error('[empresa/jobs:create]', jobError)
      return NextResponse.json(
        { error: jobError.message || 'Erro ao criar vaga.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[empresa/jobs]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
