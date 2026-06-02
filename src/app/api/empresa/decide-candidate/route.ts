import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Action = 'approve' | 'reject' | 'schedule'

const statusMap: Record<Action, string> = {
  approve: 'client_approved',
  reject: 'client_rejected',
  schedule: 'interview_scheduled',
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
      reason?: string
    }

    if (!body.submissionId || !body.action || !statusMap[body.action]) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Busca todas as empresas em que o user é membro (modelo N:M permite múltiplas)
    const { data: memberships } = await admin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const userCompanyIds = memberships.map(m => m.company_id)

    // Valida que a submissão é de uma vaga de alguma empresa do user
    const { data: sub } = await admin
      .from('submissions')
      .select('id, jobs(company_id)')
      .eq('id', body.submissionId)
      .maybeSingle<{ id: string; jobs: { company_id: string } | { company_id: string }[] | null }>()

    if (!sub) {
      return NextResponse.json({ error: 'Submissão não encontrada.' }, { status: 404 })
    }

    const jobsRel = Array.isArray(sub.jobs) ? sub.jobs[0] : sub.jobs
    if (!jobsRel || !userCompanyIds.includes(jobsRel.company_id)) {
      return NextResponse.json({ error: 'Sem permissão pra esta submissão.' }, { status: 403 })
    }

    const updatePayload: Record<string, unknown> = {
      status: statusMap[body.action],
    }
    if (body.reason && (body.action === 'approve' || body.action === 'reject')) {
      updatePayload.client_feedback = body.reason
      updatePayload.client_reviewed_at = new Date().toISOString()
    }

    const { error: updateError } = await admin
      .from('submissions')
      .update(updatePayload)
      .eq('id', body.submissionId)

    if (updateError) {
      console.error('[empresa/decide-candidate]', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Falha ao atualizar.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[empresa/decide-candidate]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
