import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ACCEPTED_MIME = 'application/pdf'

/**
 * Upload de CV pelo próprio candidato (role='candidate'). Path:
 * {user_id}/{uuid}.pdf — mesma convenção do hunter, isolada por owner.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'candidate') {
      return NextResponse.json(
        { error: 'Apenas candidatos podem enviar CV pelo próprio perfil.' },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo inválido.' }, { status: 400 })
    }
    if (file.type !== ACCEPTED_MIME) {
      return NextResponse.json({ error: 'Apenas PDFs são aceitos.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Arquivo maior que 5MB.' }, { status: 400 })
    }

    const storagePath = `${user.id}/${crypto.randomUUID()}.pdf`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from('cvs')
      .upload(storagePath, buffer, {
        contentType: ACCEPTED_MIME,
        upsert: false,
      })

    if (uploadError) {
      console.error('[candidate/upload-cv]', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Falha ao enviar currículo.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ storagePath, fileName: file.name })
  } catch (error) {
    console.error('[candidate/upload-cv]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
