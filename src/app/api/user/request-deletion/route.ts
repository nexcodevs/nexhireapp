import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit'

/**
 * LGPD Art. 18 — direito à exclusão dos dados.
 * Marca deletion_requested_at. Admin processa manualmente em até 15 dias úteis
 * (anonimização ou hard delete conforme regra interna).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as { reason?: string }
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : null

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('users')
      .select('role, deletion_requested_at')
      .eq('id', user.id)
      .maybeSingle()

    if (existing?.deletion_requested_at) {
      return NextResponse.json({
        ok: true,
        alreadyRequested: true,
        requested_at: existing.deletion_requested_at,
      })
    }

    const { error: updateError } = await admin
      .from('users')
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      console.error('[user/request-deletion]', updateError)
      return NextResponse.json(
        { error: 'Falha ao registrar pedido de exclusão.' },
        { status: 500 },
      )
    }

    await logAudit({
      actorId: user.id,
      actorRole: existing?.role ?? null,
      action: 'user.deletion_requested',
      targetType: 'user',
      targetId: user.id,
      payload: reason ? { reason } : undefined,
    })

    return NextResponse.json({ ok: true, alreadyRequested: false })
  } catch (error) {
    console.error('[user/request-deletion]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
