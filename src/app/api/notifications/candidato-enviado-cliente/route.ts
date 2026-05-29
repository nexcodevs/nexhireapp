import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notificarCandidatoEnviadoCliente } from '@/lib/email/templates/candidatoEnviadoCliente'
import { notifyUsers } from '@/lib/notifications'

interface SubmissionRelations {
  id: string
  candidates: { full_name: string | null } | null
  jobs: { id: string; title: string | null; company_id: string; companies: { name: string | null } | null } | null
}

interface CompanyUserRelation {
  user_id: string
  users: { email: string | null; full_name: string | null } | null
}

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()
    if (!submissionId) return NextResponse.json({ error: 'submissionId obrigatório' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createAdminClient()

    // Apenas HR/admin podem disparar essa notificação (significa que estão
    // enviando o candidato pra empresa). Endpoint sensível.
    const { data: actorData } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (actorData?.role !== 'hr_manager' && actorData?.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { data: sub, error } = await admin
      .from('submissions')
      .select(`
        id,
        candidates ( full_name ),
        jobs ( id, title, company_id, companies ( name ) )
      `)
      .eq('id', submissionId)
      .single<SubmissionRelations>()

    if (error || !sub) return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })

    const companyId = sub.jobs?.company_id
    if (!companyId) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

    const { data: companyUsers } = await admin
      .from('company_users')
      .select('user_id, users ( email, full_name )')
      .eq('company_id', companyId)
      .returns<CompanyUserRelation[]>()

    if (!companyUsers || companyUsers.length === 0) {
      return NextResponse.json({ warning: 'Nenhum usuário da empresa para notificar' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    void notifyUsers(
      companyUsers.map(cu => cu.user_id),
      {
        type: 'candidate_sent_to_you',
        title: 'Candidato para avaliar',
        message: `${sub.candidates?.full_name || 'Um candidato'} foi enviado para ${sub.jobs?.title || 'sua vaga'}.`,
        link: `/empresa/candidatos/${sub.id}`,
      },
    )

    const results = await Promise.all(
      companyUsers.map(async cu => {
        const u = cu.users
        if (!u?.email) return null
        return notificarCandidatoEnviadoCliente({
          clientEmail: u.email,
          clientName: u.full_name ?? undefined,
          candidateName: sub.candidates?.full_name || 'Candidato',
          jobTitle: sub.jobs?.title || 'Vaga',
          submissionId: sub.id,
          appUrl,
        })
      })
    )

    return NextResponse.json({ success: true, sent: results.filter(Boolean).length })
  } catch (err: unknown) {
    console.error('[notify-client] erro:', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
