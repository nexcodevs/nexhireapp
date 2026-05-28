import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notificarNovaSubmissao } from '@/lib/email/templates/novaSubmissao'

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()
    console.log('[notify] submissionId recebido:', submissionId)

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    // Autenticação: usuário precisa estar logado
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[notify] user logado:', user?.email)
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Admin client para queries que ignoram RLS
    const admin = createAdminClient()

    // Busca dados da submissão
    const { data: sub, error } = await admin
      .from('submissions')
      .select(`
        id,
        candidates ( full_name ),
        jobs ( title, companies ( name ) ),
        recruiters ( users ( full_name ) )
      `)
      .eq('id', submissionId)
      .single()

    console.log('[notify] submissão encontrada?', !!sub)
    if (error || !sub) {
      return NextResponse.json({ error: 'Submissão não encontrada', detail: error?.message }, { status: 404 })
    }

    // Busca HRs (ignora RLS via admin)
    const { data: hrs } = await admin
      .from('users')
      .select('email, full_name, role')
      .in('role', ['hr_manager', 'admin'])

    console.log('[notify] HRs encontrados:', hrs?.length)

    if (!hrs || hrs.length === 0) {
      return NextResponse.json({ warning: 'Nenhum HR para notificar' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const results = await Promise.all(
      hrs.map(async (hr) => {
        console.log('[notify] enviando para:', hr.email)
        const res = await notificarNovaSubmissao({
          hrEmail: hr.email,
          hrName: hr.full_name || undefined,
          candidateName: (sub.candidates as any)?.full_name || 'Candidato',
          jobTitle: (sub.jobs as any)?.title || 'Vaga',
          companyName: (sub.jobs as any)?.companies?.name || 'Empresa',
          hunterName: (sub.recruiters as any)?.users?.full_name || 'Hunter',
          submissionId: sub.id,
          appUrl,
        })
        console.log('[notify] resultado:', hr.email, res)
        return res
      })
    )

    return NextResponse.json({ success: true, sent: results.length })
  } catch (err: any) {
    console.error('[notify] EXCEÇÃO:', err)
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}