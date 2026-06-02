import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prefillSubmission } from '@/lib/ai/analyze'
import { parseCV } from '@/lib/ai/parseCV'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'
import { enforceAiRateLimit } from '@/lib/ratelimit'
import { NextResponse } from 'next/server'

interface JobRow {
  id: string
  title: string
  seniority: string | null
  description: string | null
  status: string
  required_skills: unknown
  desired_skills: unknown
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const rl = await enforceAiRateLimit(user.id)
    if (rl) return rl

    const quota = await checkDailyAIQuota(user.id, 'prefill_submission', DAILY_AI_LIMITS.prefill_submission)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário de pré-fills atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    const body = (await request.json()) as { jobId?: unknown; cvPath?: unknown }
    const jobId = typeof body.jobId === 'string' ? body.jobId : ''
    const cvPath = typeof body.cvPath === 'string' ? body.cvPath : ''

    if (!jobId || !cvPath) {
      return NextResponse.json(
        { error: 'jobId e cvPath são obrigatórios.' },
        { status: 400 },
      )
    }

    const admin = createAdminClient()

    // Confere se a vaga existe e está aberta
    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select('id, title, seniority, description, status, required_skills, desired_skills')
      .eq('id', jobId)
      .maybeSingle<JobRow>()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 })
    }

    if (job.status !== 'open_for_hunters') {
      return NextResponse.json(
        { error: 'Vaga não está aberta para envio.' },
        { status: 422 },
      )
    }

    // Baixa e parseia o CV
    const { data: blob, error: downloadError } = await admin.storage
      .from('cvs')
      .download(cvPath)

    if (downloadError || !blob) {
      console.warn('[prefill:cv-download]', downloadError)
      return NextResponse.json(
        { error: 'Não foi possível ler o CV. Tente reenviar.' },
        { status: 422 },
      )
    }

    let cvText = ''
    try {
      const buffer = Buffer.from(await blob.arrayBuffer())
      cvText = await parseCV(buffer)
    } catch (parseError) {
      console.warn('[prefill:cv-parse]', parseError)
      return NextResponse.json(
        { error: 'Não conseguimos extrair texto do CV.' },
        { status: 422 },
      )
    }

    if (cvText.trim().length < 100) {
      return NextResponse.json(
        { error: 'CV muito curto pra análise. Verifique se é o arquivo certo.' },
        { status: 422 },
      )
    }

    const jobRequiredSkills = Array.isArray(job.required_skills)
      ? (job.required_skills as string[]).filter(s => typeof s === 'string')
      : []
    const jobDesiredSkills = Array.isArray(job.desired_skills)
      ? (job.desired_skills as string[]).filter(s => typeof s === 'string')
      : []

    const suggestion = await prefillSubmission(
      {
        jobTitle: job.title,
        jobDescription: job.description ?? '',
        seniority: job.seniority ?? '',
        cvText,
        jobRequiredSkills,
        jobDesiredSkills,
      },
      user.id,
    )

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('[prefill]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
