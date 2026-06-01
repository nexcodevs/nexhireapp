import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface OnboardingBody {
  name?: string
  website?: string
  industry?: string
  size?: string
  tosVersion?: string
}

/**
 * Cria empresa + vincula user como owner em company_users.
 * Server-side via admin client pra bypass de RLS — fluxo crítico de signup
 * não pode depender de policies do client (que podem mudar e quebrar).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = (await request.json()) as OnboardingBody
    const name = body.name?.trim() ?? ''
    const website = body.website?.trim() || null
    const industry = body.industry?.trim() ?? ''
    const size = body.size?.trim() ?? ''
    const tosVersion = body.tosVersion?.trim() ?? ''

    if (name.length < 2) {
      return NextResponse.json({ error: 'Nome da empresa obrigatório.' }, { status: 400 })
    }
    if (!industry) {
      return NextResponse.json({ error: 'Setor obrigatório.' }, { status: 400 })
    }
    if (!size) {
      return NextResponse.json({ error: 'Tamanho obrigatório.' }, { status: 400 })
    }
    if (!tosVersion) {
      return NextResponse.json({ error: 'Aceite dos Termos obrigatório.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Confere se user já tem company vinculada (evita duplicação caso clique duas vezes)
    const { data: existing } = await admin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.company_id) {
      return NextResponse.json({ companyId: existing.company_id, alreadyExists: true })
    }

    const companyId = crypto.randomUUID()

    const { error: companyError } = await admin.from('companies').insert({
      id: companyId,
      name,
      website,
      industry,
      size,
    })
    if (companyError) {
      console.error('[empresa-onboarding:company]', companyError)
      return NextResponse.json(
        { error: 'Não foi possível criar a empresa.', detail: companyError.message },
        { status: 500 },
      )
    }

    const { error: linkError } = await admin.from('company_users').insert({
      id: crypto.randomUUID(),
      company_id: companyId,
      user_id: user.id,
      role: 'owner',
      tos_accepted_at: new Date().toISOString(),
      tos_version: tosVersion,
    })
    if (linkError) {
      console.error('[empresa-onboarding:link]', linkError)
      // Cleanup: empresa foi criada mas link falhou — apaga pra não deixar lixo
      await admin.from('companies').delete().eq('id', companyId)
      return NextResponse.json(
        { error: 'Não conseguimos vincular você à empresa.', detail: linkError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ companyId, alreadyExists: false })
  } catch (err: unknown) {
    console.error('[empresa-onboarding]', err)
    const message = err instanceof Error ? err.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
