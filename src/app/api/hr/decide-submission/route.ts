import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Action = 'approve' | 'reject' | 'send'

const statusMap: Record<Action, string> = {
  approve: 'hr_approved',
  reject: 'hr_rejected',
  send: 'sent_to_client',
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = (await request.json()) as {
      submissionId?: string
      action?: Action
      notes?: string
    }

    if (!body.submissionId || !body.action || !statusMap[body.action]) {
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

    const updatePayload: Record<string, unknown> = {
      status: statusMap[body.action],
    }
    if (body.notes && (body.action === 'approve' || body.action === 'reject')) {
      updatePayload.hr_notes = body.notes
      updatePayload.hr_reviewed_at = new Date().toISOString()
      updatePayload.hr_reviewed_by = user.id
    }
    if (body.action === 'send') {
      updatePayload.sent_to_client_at = new Date().toISOString()
    }

    const { error: updateError } = await admin
      .from('submissions')
      .update(updatePayload)
      .eq('id', body.submissionId)

    if (updateError) {
      console.error('[hr/decide-submission]', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Falha ao atualizar status.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[hr/decide-submission]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
