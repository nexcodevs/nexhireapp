import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assessCandidate, type AssessmentAnswer } from '@/lib/ai/analyze'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'
import { enforceAiRateLimit } from '@/lib/ratelimit'

interface RequestBody {
  submissionId?: string
  /** Array de { question, answer, score?, notes? } */
  answers?: AssessmentAnswer[]
}

interface SubRow {
  id: string
  ai_summary: string | null
  hunter_score: number | null
  candidates: { full_name: string | null; current_title: string | null } | null
  jobs: {
    title: string | null
    description: string | null
    seniority: string | null
    required_skills: unknown
    behavioral_competencies: unknown
    culture_fit: string | null
  } | null
}

/**
 * Aplica avaliação IA sobre as respostas que o HR coletou.
 * Cria/atualiza submission_assessments e marca status='completed'.
 *
 * Apenas HR e admin podem chamar.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const rl = await enforceAiRateLimit(user.id)
    if (rl) return rl

    const admin = createAdminClient()
    const { data: actor } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (actor?.role !== 'hr_manager' && actor?.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const quota = await checkDailyAIQuota(user.id, 'assess_candidate', DAILY_AI_LIMITS.assess_candidate)
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Limite diário de avaliações atingido (${quota.used}/${quota.limit}).` },
        { status: 429 },
      )
    }

    const body = (await request.json()) as RequestBody
    if (!body.submissionId || !Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json(
        { error: 'submissionId e answers (array não vazio) obrigatórios.' },
        { status: 400 },
      )
    }

    // Pega contexto da submissão
    const { data: sub, error: subErr } = await admin
      .from('submissions')
      .select(
        'id, ai_summary, hunter_score, candidates(full_name, current_title), jobs(title, description, seniority, required_skills, behavioral_competencies, culture_fit)',
      )
      .eq('id', body.submissionId)
      .single<SubRow>()

    if (subErr || !sub) {
      return NextResponse.json({ error: 'Submissão não encontrada.' }, { status: 404 })
    }

    const candidateName = sub.candidates?.full_name ?? 'Candidato'
    const candidateTitle = sub.candidates?.current_title ?? null
    const job = sub.jobs

    if (!job?.title) {
      return NextResponse.json({ error: 'Vaga associada inválida.' }, { status: 422 })
    }

    const result = await assessCandidate(
      {
        candidateName,
        candidateTitle,
        jobTitle: job.title,
        jobDescription: job.description ?? '',
        seniority: job.seniority ?? '',
        requiredSkills: Array.isArray(job.required_skills)
          ? (job.required_skills as string[]).filter(s => typeof s === 'string')
          : [],
        behavioralCompetencies: Array.isArray(job.behavioral_competencies)
          ? (job.behavioral_competencies as string[]).filter(s => typeof s === 'string')
          : [],
        cultureFit: job.culture_fit,
        answers: body.answers,
        hunterScore: sub.hunter_score,
        aiAnalysisSummary: sub.ai_summary,
      },
      user.id,
    )

    // Upsert no submission_assessments (uma avaliação ativa por submissão)
    const { data: existing } = await admin
      .from('submission_assessments')
      .select('id')
      .eq('submission_id', body.submissionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const payload = {
      submission_id: body.submissionId,
      assessor_user_id: user.id,
      answers: body.answers,
      technical_score: result.technical_score,
      behavioral_score: result.behavioral_score,
      cultural_fit_score: result.cultural_fit_score,
      overall_score: result.overall_score,
      ai_summary: result.ai_summary,
      recommendation: result.recommendation,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }

    if (existing?.id) {
      const { error: updErr } = await admin
        .from('submission_assessments')
        .update(payload)
        .eq('id', existing.id)
      if (updErr) {
        console.error('[assess-candidate:update]', updErr)
        return NextResponse.json({ error: 'Erro ao salvar avaliação.' }, { status: 500 })
      }
    } else {
      const { error: insErr } = await admin
        .from('submission_assessments')
        .insert({ id: crypto.randomUUID(), ...payload })
      if (insErr) {
        console.error('[assess-candidate:insert]', insErr)
        return NextResponse.json({ error: 'Erro ao salvar avaliação.' }, { status: 500 })
      }
    }

    return NextResponse.json({
      assessment: {
        ...result,
        strengths: result.strengths,
        concerns: result.concerns,
      },
    })
  } catch (error) {
    console.error('[assess-candidate]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
