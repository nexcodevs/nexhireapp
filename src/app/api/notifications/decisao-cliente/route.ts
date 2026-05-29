import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notificarDecisaoCliente } from '@/lib/email/templates/decisaoCliente'

interface SubmissionRelations {
  id: string
  candidates: { full_name: string | null } | null
  jobs: { title: string | null; companies: { name: string | null } | null } | null
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
        jobs ( title, companies ( name ) )
      `)
      .eq('id', submissionId)
      .single<SubmissionRelations>()

    if (error || !sub) return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })

    const { data: hrs } = await admin
      .from('users')
      .select('email, full_name')
      .in('role', ['hr_manager', 'admin'])

    if (!hrs || hrs.length === 0) return NextResponse.json({ warning: 'Nenhum HR' })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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