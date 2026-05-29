import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { compareCandidates } from '@/lib/ai/analyze'
import { parseCV } from '@/lib/ai/parseCV'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'

interface RawSub {
  id: string
  interview_summary: string | null
  ai_summary: string | null
  ai_score: number | null
  candidates: { full_name: string; current_title: string | null; cv_url: string | null } | null
  jobs: { id: string; title: string; description: string | null; seniority: string | null } | null
}

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const quota = await checkDailyAIQuota(user.id, 'compare_candidates', DAILY_AI_LIMITS.compare_candidates)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário de comparações atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    const { submissionIds } = (await request.json()) as { submissionIds?: unknown }
    if (!Array.isArray(submissionIds) || submissionIds.length < 2) {
      return NextResponse.json(
        { error: 'Selecione pelo menos 2 candidatos pra comparar.' },
        { status: 400 },
      )
    }
    if (submissionIds.length > 4) {
      return NextResponse.json(
        { error: 'Máximo 4 candidatos por comparação.' },
        { status: 400 },
      )
    }

    const ids = submissionIds.filter((s): s is string => typeof s === 'string')

    const { data: subs } = await supabase
      .from('submissions')
      .select(
        'id, interview_summary, ai_summary, ai_score, candidates(full_name, current_title, cv_url), jobs(id, title, description, seniority)',
      )
      .in('id', ids)
      .returns<RawSub[]>()

    if (!subs || subs.length < 2) {
      return NextResponse.json({ error: 'Submissões não encontradas.' }, { status: 404 })
    }

    // Todas as submissões devem ser da MESMA vaga
    const jobIds = new Set(subs.map(s => s.jobs?.id).filter(Boolean))
    if (jobIds.size !== 1) {
      return NextResponse.json(
        { error: 'Só dá pra comparar candidatos da mesma vaga.' },
        { status: 400 },
      )
    }

    const job = subs[0].jobs
    if (!job) {
      return NextResponse.json({ error: 'Dados da vaga incompletos.' }, { status: 422 })
    }

    // Baixa e parseia CVs em paralelo
    const candidates = await Promise.all(
      subs.map(async sub => {
        let cvText = ''
        if (sub.candidates?.cv_url) {
          try {
            const { data: blob } = await supabase.storage
              .from('cvs')
              .download(sub.candidates.cv_url)
            if (blob) {
              const buffer = Buffer.from(await blob.arrayBuffer())
              cvText = await parseCV(buffer)
            }
          } catch (err) {
            console.warn(`[compare] CV parse falhou pra ${sub.id}:`, err)
          }
        }
        return {
          id: sub.id,
          name: sub.candidates?.full_name ?? 'Candidato',
          currentTitle: sub.candidates?.current_title ?? null,
          cvText,
          interviewSummary: sub.interview_summary,
          aiSummary: sub.ai_summary,
          aiScore: sub.ai_score,
        }
      }),
    )

    const comparison = await compareCandidates(
      {
        jobTitle: job.title,
        jobDescription: job.description ?? '',
        seniority: job.seniority ?? '',
        candidates,
      },
      user.id,
    )

    return NextResponse.json({ comparison })
  } catch (error) {
    console.error('[compare-candidates]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
