import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit'

type Action = 'approve' | 'reject'
type Visibility = 'open' | 'specialist_plus' | 'top_hunters_only'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = (await request.json()) as {
      jobId?: string
      action?: Action
      visibility?: Visibility
      maxSubmissions?: number
    }

    if (!body.jobId || (body.action !== 'approve' && body.action !== 'reject')) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'hr_manager' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    let updatePayload: Record<string, unknown>
    if (body.action === 'approve') {
      const validVisibilities: Visibility[] = ['open', 'specialist_plus', 'top_hunters_only']
      const visibility: Visibility = validVisibilities.includes(body.visibility as Visibility)
        ? (body.visibility as Visibility)
        : 'open'
      const maxSubmissions = Number.isFinite(body.maxSubmissions) && body.maxSubmissions! > 0
        ? Math.min(50, Math.floor(body.maxSubmissions!))
        : 3
      updatePayload = {
        status: 'open_for_hunters',
        visibility_type: visibility,
        max_submissions_per_recruiter: maxSubmissions,
      }
    } else {
      updatePayload = { status: 'cancelled' }
    }

    const { error: updateError } = await admin
      .from('jobs')
      .update(updatePayload)
      .eq('id', body.jobId)

    if (updateError) {
      console.error('[hr/decide-job]', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Falha ao atualizar vaga.' },
        { status: 500 },
      )
    }

    await logAudit({
      actorId: user.id,
      actorRole: profile.role,
      action: `job.${body.action === 'approve' ? 'approved' : 'rejected'}`,
      targetType: 'job',
      targetId: body.jobId,
      payload: body.action === 'approve'
        ? {
            visibility: updatePayload.visibility_type,
            max_submissions: updatePayload.max_submissions_per_recruiter,
          }
        : undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[hr/decide-job]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
