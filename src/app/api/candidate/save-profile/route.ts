import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface SaveProfileBody {
  full_name?: string
  email?: string
  phone?: string | null
  linkedin_url?: string | null
  current_title?: string | null
  location?: string | null
  years_experience?: number | null
  skills?: string[]
  language_proficiency?: { language: string; level: string }[]
  certifications?: string[]
  cv_url?: string | null
}

/**
 * Cria ou atualiza a row em candidates do próprio user logado.
 * unique(user_id) garante 1 perfil por candidato — usa upsert via
 * 'on conflict user_id'. Email vem de users (não editável aqui).
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
      .select('role, email, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'candidate') {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const body = (await request.json()) as SaveProfileBody

    const sanitized = {
      user_id: user.id,
      full_name: (body.full_name ?? profile.full_name ?? '').trim() || profile.full_name || user.email,
      email: profile.email ?? user.email,
      phone: body.phone?.toString().trim() || null,
      linkedin_url: body.linkedin_url?.toString().trim() || null,
      current_title: body.current_title?.toString().trim() || null,
      location: body.location?.toString().trim() || null,
      years_experience:
        typeof body.years_experience === 'number' && body.years_experience >= 0 && body.years_experience <= 60
          ? Math.floor(body.years_experience)
          : null,
      skills: Array.isArray(body.skills)
        ? body.skills.filter(s => typeof s === 'string' && s.trim()).slice(0, 30).map(s => s.trim())
        : [],
      language_proficiency: Array.isArray(body.language_proficiency)
        ? body.language_proficiency
            .filter(l => l && typeof l.language === 'string' && typeof l.level === 'string')
            .slice(0, 10)
        : [],
      certifications: Array.isArray(body.certifications)
        ? body.certifications.filter(c => typeof c === 'string' && c.trim()).slice(0, 15).map(c => c.trim())
        : [],
      cv_url: body.cv_url?.toString().trim() || null,
    }

    const { data: existing } = await admin
      .from('candidates')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.id) {
      const { error: updateError } = await admin
        .from('candidates')
        .update(sanitized)
        .eq('id', existing.id)
      if (updateError) {
        console.error('[candidate/save-profile:update]', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Falha ao atualizar perfil.' },
          { status: 500 },
        )
      }
      return NextResponse.json({ ok: true, candidateId: existing.id, created: false })
    }

    const newId = crypto.randomUUID()
    const { error: insertError } = await admin
      .from('candidates')
      .insert({ id: newId, ...sanitized })

    if (insertError) {
      console.error('[candidate/save-profile:insert]', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Falha ao criar perfil.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, candidateId: newId, created: true })
  } catch (error) {
    console.error('[candidate/save-profile]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
