import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCV } from '@/lib/ai/parseCV'
import { extractCandidateProfile } from '@/lib/ai/analyze'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'
import { enforceAiRateLimit } from '@/lib/ratelimit'

export const maxDuration = 60

/**
 * Recebe storagePath de um CV já no bucket `cvs` (do mesmo user),
 * faz parse + extração estruturada via IA, retorna JSON pra preview.
 * Não persiste nada — o /api/candidate/save-profile faz isso depois
 * que o candidato confirma.
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
    const { data: profile } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'candidate') {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const quota = await checkDailyAIQuota(
      user.id,
      'enrich_candidate_profile',
      DAILY_AI_LIMITS.enrich_candidate_profile,
    )
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Limite diário de enriquecimento atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.` },
        { status: 429 },
      )
    }

    const body = (await request.json()) as { storagePath?: string }
    const storagePath = typeof body.storagePath === 'string' ? body.storagePath : ''
    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath obrigatório.' }, { status: 400 })
    }

    // Garantir que o path pertence ao próprio user (defesa em profundidade)
    if (!storagePath.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'CV não pertence ao seu usuário.' }, { status: 403 })
    }

    const { data: file, error: downloadError } = await admin.storage
      .from('cvs')
      .download(storagePath)
    if (downloadError || !file) {
      console.error('[candidate/enrich:download]', downloadError)
      return NextResponse.json({ error: 'CV não encontrado no storage.' }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const cvText = await parseCV(buffer)

    if (cvText.trim().length < 80) {
      return NextResponse.json(
        { error: 'PDF parece vazio ou não-legível. Use um CV em texto, não imagem.' },
        { status: 422 },
      )
    }

    const extraction = await extractCandidateProfile(cvText, user.id)

    return NextResponse.json({ extraction })
  } catch (error) {
    console.error('[candidate/enrich-profile]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
