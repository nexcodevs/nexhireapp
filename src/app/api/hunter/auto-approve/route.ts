import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateHunterRisk } from '@/lib/ai/analyze'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'
import { logAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/ratelimit'

interface RequestBody {
  linkedinUrl?: unknown
  specialties?: unknown
  yearsExperience?: unknown
  bio?: unknown
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const quota = await checkDailyAIQuota(user.id, 'evaluate_hunter', DAILY_AI_LIMITS.evaluate_hunter)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas hoje (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    const body = (await request.json()) as RequestBody
    const linkedinUrl = typeof body.linkedinUrl === 'string' ? body.linkedinUrl.trim() : ''
    const bio = typeof body.bio === 'string' ? body.bio.trim() : ''
    const yearsExperience =
      typeof body.yearsExperience === 'number' ? body.yearsExperience : 0
    const specialties = Array.isArray(body.specialties)
      ? (body.specialties as unknown[]).filter(
          (s): s is string => typeof s === 'string' && s.trim().length > 0,
        )
      : []

    if (!linkedinUrl || !bio || specialties.length === 0) {
      return NextResponse.json(
        { error: 'LinkedIn, especialidades e bio são obrigatórios.' },
        { status: 400 },
      )
    }

    // Busca dados do user pra IA
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    // Chama IA
    const assessment = await evaluateHunterRisk(
      {
        fullName: userData.full_name ?? '',
        email: userData.email,
        linkedinUrl,
        specialties,
        yearsExperience,
        bio,
      },
      user.id,
    )

    const newStatus =
      assessment.decision === 'auto_approve'
        ? 'approved'
        : assessment.decision === 'reject'
          ? 'rejected'
          : 'pending'

    // Upsert no recruiter (RLS pode bloquear insert direto se user não tem
    // role hunter ainda; usamos admin client pra confiabilidade)
    const admin = createAdminClient()

    const { error: upsertError } = await admin
      .from('recruiters')
      .upsert(
        {
          user_id: user.id,
          status: newStatus,
          level: 'beginner',
          linkedin_url: linkedinUrl,
          specialties,
          years_experience: yearsExperience,
          bio,
          ai_risk_assessment: assessment,
        },
        { onConflict: 'user_id' },
      )

    if (upsertError) {
      console.error('[hunter:auto-approve:upsert]', upsertError)
      return NextResponse.json(
        { error: 'Não conseguimos finalizar seu cadastro. Tente novamente.' },
        { status: 500 },
      )
    }

    await logAudit({
      actorId: user.id,
      actorRole: 'recruiter',
      action: `hunter.ai_${assessment.decision}`,
      targetType: 'recruiter',
      targetId: user.id,
      payload: {
        decision: assessment.decision,
        confidence: assessment.confidence,
        red_flags: assessment.red_flags,
        new_status: newStatus,
      },
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      decision: assessment.decision,
      status: newStatus,
      reasoning: assessment.reasoning,
    })
  } catch (error) {
    console.error('[hunter:auto-approve]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
