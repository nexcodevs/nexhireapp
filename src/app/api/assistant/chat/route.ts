import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatWithAssistant, type AssistantContext, type AssistantMessage } from '@/lib/ai/assistant'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'

type Role = AssistantContext['userRole']

interface RequestBody {
  messages?: unknown
  pageUrl?: unknown
}

function isMessage(m: unknown): m is AssistantMessage {
  return (
    typeof m === 'object' &&
    m !== null &&
    'role' in m &&
    'content' in m &&
    typeof (m as { content: unknown }).content === 'string' &&
    ((m as { role: string }).role === 'user' || (m as { role: string }).role === 'assistant')
  )
}

async function buildPageData(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  role: Role,
): Promise<Record<string, unknown>> {
  // Coleta dados básicos por papel — sem tools, sem pesado RAG
  if (role === 'company_user') {
    const { data: cu } = await admin
      .from('company_users')
      .select('company_id, companies(name)')
      .eq('user_id', userId)
      .single()
    const companyId = cu?.company_id as string | undefined
    if (!companyId) return { has_company: false }

    const [openJobs, candidatesWaiting, hires30d] = await Promise.all([
      admin
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'open_for_hunters'),
      admin
        .from('submissions')
        .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
        .eq('status', 'sent_to_client')
        .eq('jobs.company_id', companyId),
      admin
        .from('submissions')
        .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
        .eq('status', 'hired')
        .eq('jobs.company_id', companyId)
        .gte('hired_at', new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const companies = cu?.companies as { name: string | null } | { name: string | null }[] | null
    const companyName = Array.isArray(companies) ? companies[0]?.name : companies?.name

    return {
      company_name: companyName,
      open_jobs: openJobs.count ?? 0,
      candidates_waiting_review: candidatesWaiting.count ?? 0,
      hires_last_30_days: hires30d.count ?? 0,
    }
  }

  if (role === 'recruiter') {
    const { data: rec } = await admin
      .from('recruiters')
      .select('id, status, level')
      .eq('user_id', userId)
      .single()
    if (!rec) return { has_recruiter_profile: false }

    const [available, mine] = await Promise.all([
      admin
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open_for_hunters'),
      admin
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('recruiter_id', rec.id),
    ])

    return {
      recruiter_status: rec.status,
      recruiter_level: rec.level,
      open_jobs_marketplace: available.count ?? 0,
      my_total_submissions: mine.count ?? 0,
    }
  }

  if (role === 'hr_manager' || role === 'admin') {
    const [companies, hunters, jobsOpen, submissionsPending] = await Promise.all([
      admin.from('companies').select('id', { count: 'exact', head: true }),
      admin
        .from('recruiters')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),
      admin
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open_for_hunters'),
      admin
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'submitted'),
    ])

    return {
      platform_companies: companies.count ?? 0,
      platform_approved_hunters: hunters.count ?? 0,
      platform_open_jobs: jobsOpen.count ?? 0,
      submissions_pending_curation: submissionsPending.count ?? 0,
    }
  }

  return {}
}

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const quota = await checkDailyAIQuota(user.id, 'assistant_chat', DAILY_AI_LIMITS.assistant_chat)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário do assistente atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    const body = (await request.json()) as RequestBody
    const messages = Array.isArray(body.messages) ? body.messages.filter(isMessage) : []
    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl : '/'

    if (messages.length === 0) {
      return NextResponse.json({ error: 'Sem mensagem.' }, { status: 400 })
    }
    if (messages.length > 20) {
      return NextResponse.json({ error: 'Conversa muito longa.' }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    const role = (userData.role ?? 'candidate') as Role
    const admin = createAdminClient()
    const pageData = await buildPageData(admin, user.id, role)

    const reply = await chatWithAssistant(
      messages,
      {
        userRole: role,
        userName: userData.full_name,
        pageUrl,
        pageData,
      },
      user.id,
    )

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[assistant]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
