import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notificarDecisaoCliente } from '@/lib/email/templates/decisaoCliente'
import { notifyUsers } from '@/lib/notifications'

interface SubmissionRelations {
  id: string
  candidates: { full_name: string | null } | null
  jobs: { id: string; title: string | null; company_id: string; companies: { name: string | null } | null } | null
  recruiters: { user_id: string } | null
}

export async function POST(request: Request) {
  try {
    const { submissionId, decision, reason } = await request.json()
    if (!submissionId || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'submissionId e decision (approved|rejected) obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createAdminClient()

    const { data: sub, error } = await admin
      .from('submissions')
      .select(`
        id,
        candidates ( full_name ),
        jobs ( id, title, company_id, companies ( name ) ),
        recruiters ( user_id )
      `)
      .eq('id', submissionId)
      .single<SubmissionRelations>()

    if (error || !sub) return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })

    // Só user da empresa OU HR/admin podem disparar (significa que cliente decidiu)
    const companyId = sub.jobs?.company_id
    const { data: actorData } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    const isPrivileged = actorData?.role === 'hr_manager' || actorData?.role === 'admin'
    let isCompanyMember = false
    if (!isPrivileged && companyId) {
      const { count } = await admin
        .from('company_users')
        .select('user_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('company_id', companyId)
      isCompanyMember = (count ?? 0) > 0
    }
    if (!isPrivileged && !isCompanyMember) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { data: hrs } = await admin
      .from('users')
      .select('id, email, full_name')
      .in('role', ['hr_manager', 'admin'])

    if (!hrs || hrs.length === 0) return NextResponse.json({ warning: 'Nenhum HR' })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const decisionLabel = decision === 'approved' ? 'aprovou' : 'reprovou'
    const targetUserIds = [...hrs.map(h => h.id)]
    if (sub.recruiters?.user_id) targetUserIds.push(sub.recruiters.user_id)

    void notifyUsers(targetUserIds, {
      type: 'client_decision',
      title: `Cliente ${decisionLabel} candidato`,
      message: `${sub.jobs?.companies?.name || 'Cliente'} ${decisionLabel} ${sub.candidates?.full_name || 'um candidato'} para ${sub.jobs?.title || 'a vaga'}.`,
      link: `/hr/submissoes/${sub.id}`,
    })

    await Promise.all(hrs.map(hr => notificarDecisaoCliente({
      hrEmail: hr.email,
      hrName: hr.full_name,
      candidateName: sub.candidates?.full_name || 'Candidato',
      jobTitle: sub.jobs?.title || 'Vaga',
      companyName: sub.jobs?.companies?.name || 'Empresa',
      decision,
      reason,
      submissionId: sub.id,
      appUrl,
    })))

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[notify-decision] erro:', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}