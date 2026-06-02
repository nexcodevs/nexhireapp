import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateInsights, type InsightRole } from '@/lib/ai/insights'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'
import { enforceAiRateLimit } from '@/lib/ratelimit'

export const maxDuration = 60

async function collectData(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  role: InsightRole,
): Promise<Record<string, unknown>> {
  const ms30d = 30 * 24 * 60 * 60 * 1000
  const since30d = new Date(new Date().getTime() - ms30d).toISOString()
  const ms7d = 7 * 24 * 60 * 60 * 1000
  const since7d = new Date(new Date().getTime() - ms7d).toISOString()

  if (role === 'company_user') {
    const { data: cu } = await admin
      .from('company_users')
      .select('company_id')
      .eq('user_id', userId)
      .single()
    const companyId = cu?.company_id as string | undefined
    if (!companyId) return { has_company: false }

    const [jobs, subs, recentJobs] = await Promise.all([
      admin
        .from('jobs')
        .select('id, status, created_at')
        .eq('company_id', companyId),
      admin
        .from('submissions')
        .select('id, status, jobs!inner(company_id)')
        .eq('jobs.company_id', companyId),
      admin
        .from('jobs')
        .select('id, title, created_at, status')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    const allJobs = jobs.data ?? []
    const allSubs = subs.data ?? []

    return {
      total_jobs: allJobs.length,
      open_jobs: allJobs.filter(j => j.status === 'open_for_hunters').length,
      jobs_pending_review: allJobs.filter(j => j.status === 'pending_hr_review').length,
      jobs_stale_no_candidates_7d: allJobs.filter(
        j => j.status === 'open_for_hunters' && new Date(j.created_at).toISOString() < since7d,
      ).length,
      candidates_waiting_review: allSubs.filter(s => s.status === 'sent_to_client').length,
      candidates_in_interview: allSubs.filter(s => s.status === 'interview_scheduled').length,
      hires_last_30d: allSubs.filter(s => s.status === 'hired').length,
      recent_jobs: recentJobs.data?.map(j => ({ id: j.id, title: j.title, status: j.status })) ?? [],
    }
  }

  if (role === 'recruiter') {
    const { data: rec } = await admin
      .from('recruiters')
      .select('id, status, level, specialties')
      .eq('user_id', userId)
      .single()
    if (!rec) return { has_recruiter_profile: false }

    const [open, mine, score] = await Promise.all([
      admin
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open_for_hunters'),
      admin.from('submissions').select('id, status').eq('recruiter_id', rec.id),
      admin
        .from('recruiter_scores')
        .select(
          'total_submissions, total_hires, hr_approval_rate, client_approval_rate, overall_score',
        )
        .eq('recruiter_id', rec.id)
        .single(),
    ])

    const mySubs = mine.data ?? []

    return {
      recruiter_status: rec.status,
      recruiter_level: rec.level,
      specialties: rec.specialties,
      open_jobs_marketplace: open.count ?? 0,
      my_total_submissions: mySubs.length,
      my_approved: mySubs.filter(s => ['hr_approved', 'sent_to_client'].includes(s.status)).length,
      my_hired: mySubs.filter(s => s.status === 'hired').length,
      my_rejected: mySubs.filter(s => s.status === 'hr_rejected').length,
      score: score.data ?? null,
    }
  }

  if (role === 'hr_manager' || role === 'admin') {
    const [pendingJobs, pendingSubs, pendingHunters, recent30d] = await Promise.all([
      admin
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_hr_review'),
      admin
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'submitted'),
      admin
        .from('recruiters')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      admin
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .gte('submitted_at', since30d),
    ])

    const extra =
      role === 'admin'
        ? await Promise.all([
            admin.from('companies').select('id', { count: 'exact', head: true }),
            admin
              .from('recruiters')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'approved'),
          ])
        : null

    return {
      jobs_pending_curation: pendingJobs.count ?? 0,
      submissions_pending_curation: pendingSubs.count ?? 0,
      hunters_pending_approval: pendingHunters.count ?? 0,
      submissions_last_30d: recent30d.count ?? 0,
      ...(extra
        ? {
            total_companies: extra[0].count ?? 0,
            total_approved_hunters: extra[1].count ?? 0,
          }
        : {}),
    }
  }

  return {}
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const rl = await enforceAiRateLimit(user.id)
    if (rl) return rl

    const quota = await checkDailyAIQuota(user.id, 'insights', DAILY_AI_LIMITS.insights)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário de insights atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    const { role } = (await request.json()) as { role?: string }
    if (!role || !['company_user', 'recruiter', 'hr_manager', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Role inválido.' }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== role) {
      return NextResponse.json({ error: 'Role não corresponde.' }, { status: 403 })
    }

    const admin = createAdminClient()
    const data = await collectData(admin, user.id, role as InsightRole)

    const insights = await generateInsights(
      {
        role: role as InsightRole,
        userName: userData.full_name,
        data,
      },
      user.id,
    )

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('[insights]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
