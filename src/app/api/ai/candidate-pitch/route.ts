import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCandidatePitch, type CandidatePitch } from '@/lib/ai/analyze'
import { parseCV } from '@/lib/ai/parseCV'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'
import { enforceAiRateLimit } from '@/lib/ratelimit'

interface SubmissionWithRelations {
  id: string
  interview_summary: string | null
  hunter_score: number | null
  hunter_score_rationale: string | null
  ai_summary: string | null
  ai_pitch: CandidatePitch | null
  candidates: {
    full_name: string
    current_title: string | null
    cv_url: string | null
  } | null
  jobs: {
    title: string
    seniority: string | null
    description: string | null
  } | null
}

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const rl = await enforceAiRateLimit(user.id)
    if (rl) return rl

    const { submissionId, force } = (await request.json()) as {
      submissionId?: string
      force?: boolean
    }
    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId obrigatório.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: sub, error: subError } = await admin
      .from('submissions')
      .select(
        'id, interview_summary, hunter_score, hunter_score_rationale, ai_summary, ai_pitch, candidates(full_name, current_title, cv_url), jobs(title, seniority, description)',
      )
      .eq('id', submissionId)
      .maybeSingle<SubmissionWithRelations>()

    if (subError || !sub || !sub.candidates || !sub.jobs) {
      return NextResponse.json({ error: 'Submissão não encontrada.' }, { status: 404 })
    }

    // Cache hit: retorna o pitch salvo
    if (sub.ai_pitch && !force) {
      return NextResponse.json({ pitch: sub.ai_pitch, cached: true })
    }

    // Quota só conta quando vai chamar o modelo (cache miss)
    const quota = await checkDailyAIQuota(user.id, 'candidate_pitch', DAILY_AI_LIMITS.candidate_pitch)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário de pitches atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    // Cache miss: gera + persiste
    let cvText = ''
    if (sub.candidates.cv_url) {
      const { data: blob } = await admin.storage
        .from('cvs')
        .download(sub.candidates.cv_url)
      if (blob) {
        try {
          const buffer = Buffer.from(await blob.arrayBuffer())
          cvText = await parseCV(buffer)
        } catch (err) {
          console.warn('[candidate-pitch:cv-parse]', err)
        }
      }
    }

    const pitch = await generateCandidatePitch(
      {
        candidateName: sub.candidates.full_name,
        candidateTitle: sub.candidates.current_title ?? '',
        jobTitle: sub.jobs.title,
        jobDescription: sub.jobs.description ?? '',
        seniority: sub.jobs.seniority ?? '',
        cvText,
        hunterScore: sub.hunter_score,
        hunterRationale: sub.hunter_score_rationale,
        aiSummary: sub.ai_summary,
        interviewSummary: sub.interview_summary,
      },
      user.id,
    )

    // Persistir cache
    const { error: updateError } = await admin
      .from('submissions')
      .update({
        ai_pitch: pitch,
        ai_pitch_generated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)

    if (updateError) {
      console.warn('[candidate-pitch:cache]', updateError.message)
    }

    return NextResponse.json({ pitch, cached: false })
  } catch (error) {
    console.error('[candidate-pitch]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
