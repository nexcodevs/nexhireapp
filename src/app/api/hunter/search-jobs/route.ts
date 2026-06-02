import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/ai/embed'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'
import { enforceAiRateLimit } from '@/lib/ratelimit'

interface MatchRow {
  id: string
  similarity: number
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

    const quota = await checkDailyAIQuota(user.id, 'search_jobs_embed', DAILY_AI_LIMITS.search_jobs_embed)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário de buscas IA atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    const { query } = (await request.json()) as { query?: unknown }
    const q = typeof query === 'string' ? query.trim() : ''
    if (q.length < 3) {
      return NextResponse.json(
        { error: 'Descreva o tipo de vaga que procura (mínimo 3 caracteres).' },
        { status: 400 },
      )
    }

    const admin = createAdminClient()

    // Gera embedding da query do hunter (1 chamada Voyage por busca)
    // Vagas sem embedding ficam fora do resultado — backfill via /api/admin/embeddings-backfill
    const queryEmbedding = await embedText(q, 'query', {
      feature: 'search_jobs_embed',
      userId: user.id,
    })

    const { data: matchesRaw, error: matchError } = await admin.rpc('match_jobs', {
      query_embedding: queryEmbedding as unknown as string,
      match_count: 20,
    })

    if (matchError) {
      console.error('[search-jobs:match]', matchError)
      return NextResponse.json(
        { error: 'Falha na busca semântica. Tente novamente.' },
        { status: 500 },
      )
    }

    const matches = (matchesRaw ?? []) as MatchRow[]
    const jobIds = matches.map(m => m.id)

    return NextResponse.json({
      jobIds,
      similarity: Object.fromEntries(matches.map(m => [m.id, m.similarity])),
    })
  } catch (error) {
    console.error('[search-jobs]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
