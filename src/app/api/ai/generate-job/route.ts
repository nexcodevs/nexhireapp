import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateJobFromBrief } from '@/lib/ai/analyze'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const quota = await checkDailyAIQuota(user.id, 'generate_job', DAILY_AI_LIMITS.generate_job)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário de gerações de vaga atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    const body = (await request.json()) as { brief?: unknown; companyId?: unknown }
    const brief = typeof body.brief === 'string' ? body.brief.trim() : ''
    const companyId = typeof body.companyId === 'string' ? body.companyId : ''

    if (brief.length < 15) {
      return NextResponse.json(
        { error: 'Descreva a vaga com pelo menos uma frase completa.' },
        { status: 400 },
      )
    }

    // Admin client pra bypass RLS — user já validado via auth.getUser() acima
    const admin = createAdminClient()

    // Confere acesso à empresa
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

    // Busca contexto da empresa pra calibrar sugestões
    const { data: company } = await admin
      .from('companies')
      .select('name, industry, size')
      .eq('id', companyId)
      .single()

    const suggestion = await generateJobFromBrief(
      {
        brief,
        companyName: company?.name,
        companyIndustry: company?.industry,
        companySize: company?.size,
      },
      user.id,
    )

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('[generate-job]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
