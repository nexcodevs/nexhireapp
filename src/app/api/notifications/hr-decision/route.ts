import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notifications'

/**
 * Notifica o hunter quando HR aprova/reprova/envia uma submissão sua.
 * Acionado pelo HRSubmissionActions logo após mudar status.
 * Acesso: apenas HR/admin.
 */
export async function POST(request: Request) {
  try {
    const { submissionId, decision } = (await request.json()) as {
      submissionId?: string
      decision?: 'approved' | 'rejected' | 'sent_to_client'
    }
    if (!submissionId || !decision) {
      return NextResponse.json({ error: 'submissionId e decision obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Só HR/admin
    const { data: actor } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (actor?.role !== 'hr_manager' && actor?.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    interface SubRow {
      id: string
      candidates: { full_name: string | null } | null
      jobs: { title: string | null } | null
      recruiters: { user_id: string } | null
    }
    const { data: sub } = await admin
      .from('submissions')
      .select('id, candidates(full_name), jobs(title), recruiters(user_id)')
      .eq('id', submissionId)
      .single<SubRow>()

    const hunterId = sub?.recruiters?.user_id
    if (!sub || !hunterId) {
      return NextResponse.json({ error: 'Submissão sem hunter associado' }, { status: 404 })
    }

    const candidateName = sub.candidates?.full_name ?? 'Seu candidato'
    const jobTitle = sub.jobs?.title ?? 'a vaga'

    const messages: Record<typeof decision, { title: string; message: string }> = {
      approved: {
        title: 'Candidato aprovado pelo HR',
        message: `${candidateName} passou na curadoria e será enviado ao cliente em breve (${jobTitle}).`,
      },
      rejected: {
        title: 'Candidato reprovado pelo HR',
        message: `${candidateName} não foi aprovado na curadoria para ${jobTitle}.`,
      },
      sent_to_client: {
        title: 'Candidato enviado ao cliente',
        message: `${candidateName} foi enviado para o cliente avaliar (${jobTitle}).`,
      },
    }

    const payload = messages[decision]
    if (!payload) {
      return NextResponse.json({ error: 'decision inválida' }, { status: 400 })
    }

    void notifyUser({
      userId: hunterId,
      type: decision === 'approved' ? 'submission_approved' : decision === 'rejected' ? 'submission_rejected' : 'client_decision',
      title: payload.title,
      message: payload.message,
      link: `/hunter/submissoes`,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[notify-hr-decision]', err)
    const message = err instanceof Error ? err.message : 'Erro'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
