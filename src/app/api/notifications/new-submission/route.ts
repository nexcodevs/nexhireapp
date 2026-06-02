import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notificarNovaSubmissao } from '@/lib/email/templates/novaSubmissao'
import { notifyUsers } from '@/lib/notifications'

interface SubmissionRelations {
  id: string
  recruiter_id: string
  candidates: { full_name: string | null } | null
  jobs: { title: string | null; companies: { name: string | null } | null } | null
  recruiters: { user_id: string; users: { full_name: string | null } | null } | null
}

/**
 * Notifica HR/admin de nova submissão. Acionado pelo SubmitCandidateForm
 * logo após criar a submission. Só o hunter dono da submissão pode disparar.
 */
export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId || typeof submissionId !== 'string') {
      return NextResponse.json({ error: 'submissionId obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: sub, error } = await admin
      .from('submissions')
      .select(`
        id,
        recruiter_id,
        candidates ( full_name ),
        jobs ( title, companies ( name ) ),
        recruiters ( user_id, users ( full_name ) )
      `)
      .eq('id', submissionId)
      .single<SubmissionRelations>()

    if (error || !sub) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
    }

    // Ownership: só o hunter dono OU HR/admin podem disparar essa notificação
    const isOwner = sub.recruiters?.user_id === user.id
    let isPrivileged = false
    if (!isOwner) {
      const { data: userData } = await admin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      isPrivileged = userData?.role === 'hr_manager' || userData?.role === 'admin'
    }
    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { data: hrs } = await admin
      .from('users')
      .select('id, email, full_name, role')
      .in('role', ['hr_manager', 'admin'])

    if (!hrs || hrs.length === 0) {
      return NextResponse.json({ warning: 'Nenhum HR para notificar' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    await notifyUsers(hrs.map(h => h.id), {
      type: 'new_submission',
      title: 'Nova submissão',
      message: `${sub.recruiters?.users?.full_name || 'Hunter'} enviou ${sub.candidates?.full_name || 'um candidato'} para ${sub.jobs?.title || 'vaga'}.`,
      link: `/hr/submissoes/${sub.id}`,
    })

    const results = await Promise.all(
      hrs.map(hr =>
        notificarNovaSubmissao({
          hrEmail: hr.email,
          hrName: hr.full_name || undefined,
          candidateName: sub.candidates?.full_name || 'Candidato',
          jobTitle: sub.jobs?.title || 'Vaga',
          companyName: sub.jobs?.companies?.name || 'Empresa',
          hunterName: sub.recruiters?.users?.full_name || 'Hunter',
          submissionId: sub.id,
          appUrl,
        }),
      ),
    )

    return NextResponse.json({ success: true, sent: results.length })
  } catch (err: unknown) {
    console.error('[notify-new-submission]', err)
    const message = err instanceof Error ? err.message : 'Erro'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
