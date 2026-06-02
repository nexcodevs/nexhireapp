import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit'

/**
 * LGPD Art. 18 — direito à portabilidade dos dados.
 * Retorna JSON com tudo que a plataforma tem do user autenticado.
 * Só o próprio user pode exportar seus dados (sem permissão de terceiros).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('users')
      .select('id, email, full_name, role, avatar_url, tos_accepted_at, tos_version, created_at')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role

    // Coleta condicional por perfil
    const data: Record<string, unknown> = { profile }

    if (role === 'recruiter') {
      const { data: recruiter } = await admin
        .from('recruiters')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      data.recruiter = recruiter

      if (recruiter?.id) {
        const { data: submissions } = await admin
          .from('submissions')
          .select('id, job_id, candidate_id, status, hunter_score, hunter_score_rationale, interview_summary, submitted_at')
          .eq('recruiter_id', recruiter.id)
        data.submissions = submissions ?? []

        const candidateIds = (submissions ?? []).map(s => s.candidate_id)
        if (candidateIds.length > 0) {
          const { data: candidates } = await admin
            .from('candidates')
            .select('id, full_name, email, phone, linkedin_url, current_title, location, skills, years_experience')
            .in('id', candidateIds)
          data.candidates_submitted = candidates ?? []
        }
      }
    }

    if (role === 'company_user') {
      const { data: memberships } = await admin
        .from('company_users')
        .select('company_id, role, tos_accepted_at, tos_version')
        .eq('user_id', user.id)
      data.company_memberships = memberships ?? []

      const companyIds = (memberships ?? []).map(m => m.company_id)
      if (companyIds.length > 0) {
        const { data: companies } = await admin
          .from('companies')
          .select('id, name, website, industry, size, created_at')
          .in('id', companyIds)
        data.companies = companies ?? []

        const { data: jobs } = await admin
          .from('jobs')
          .select('id, company_id, title, description, status, seniority, location, work_model, employment_type, created_at, created_by')
          .in('company_id', companyIds)
        data.jobs = jobs ?? []
      }
    }

    if (role === 'hr_manager' || role === 'admin') {
      const { data: decisions } = await admin
        .from('audit_events')
        .select('action, target_type, target_id, payload, created_at')
        .eq('actor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000)
      data.audit_history = decisions ?? []
    }

    // Notificações in-app do user
    const { data: notifications } = await admin
      .from('notifications')
      .select('type, title, message, link, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500)
    data.notifications = notifications ?? []

    await logAudit({
      actorId: user.id,
      actorRole: role ?? null,
      action: 'user.data_exported',
      targetType: 'user',
      targetId: user.id,
    })

    const payload = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      ...data,
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="nexhire-data-${user.id}.json"`,
      },
    })
  } catch (error) {
    console.error('[user/export-data]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
