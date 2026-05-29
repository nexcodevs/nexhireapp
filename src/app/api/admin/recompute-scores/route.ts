import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/ratelimit'

/**
 * Recalcula recruiter_scores pra todos os hunters.
 * Acessível só por admin. Usa função SQL refresh_all_recruiter_scores().
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas admin.' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin.rpc('refresh_all_recruiter_scores')

    if (error) {
      console.error('[recompute-scores]', error)
      return NextResponse.json(
        { error: 'Falha ao recalcular scores.', detail: error.message },
        { status: 500 },
      )
    }

    const processed = (data as number | null) ?? 0

    await logAudit({
      actorId: user.id,
      actorRole: 'admin',
      action: 'scores.recomputed',
      targetType: 'recruiter_scores',
      targetId: null,
      payload: { recruiters_processed: processed },
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ processed })
  } catch (error) {
    console.error('[recompute-scores]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
