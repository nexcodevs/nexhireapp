import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notificarVagaLiberada } from '@/lib/email/templates/vagaLiberada'
import { visibleTypesForLevel, type RecruiterLevel, type VisibilityType } from '@/lib/visibility'
import { notifyUsers } from '@/lib/notifications'

interface JobRelations {
  id: string
  title: string
  seniority: string | null
  location: string | null
  work_model: string | null
  salary_min: number | null
  salary_max: number | null
  visibility_type: string | null
  companies: { name: string | null } | null
}

interface HunterRelation {
  user_id: string
  level: string | null
  users: { email: string | null; full_name: string | null } | null
}

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json()
    if (!jobId) return NextResponse.json({ error: 'jobId obrigatório' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createAdminClient()

    // Só HR/admin disparam aviso de vaga liberada (significa que aprovaram a vaga)
    const { data: actorData } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (actorData?.role !== 'hr_manager' && actorData?.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { data: job, error } = await admin
      .from('jobs')
      .select(`id, title, seniority, location, work_model, salary_min, salary_max, visibility_type, companies ( name )`)
      .eq('id', jobId)
      .single<JobRelations>()

    if (error || !job) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

    const jobVisibility = (job.visibility_type || 'open') as VisibilityType

    const eligibleLevels: RecruiterLevel[] = []
    if (visibleTypesForLevel('beginner').includes(jobVisibility)) eligibleLevels.push('beginner')
    if (visibleTypesForLevel('specialist').includes(jobVisibility)) eligibleLevels.push('specialist')
    if (visibleTypesForLevel('top_hunter').includes(jobVisibility)) eligibleLevels.push('top_hunter')

    const { data: hunters } = await admin
      .from('recruiters')
      .select('user_id, level, users ( email, full_name )')
      .eq('status', 'approved')
      .in('level', eligibleLevels)
      .overrideTypes<HunterRelation[]>()

    if (!hunters || hunters.length === 0) {
      return NextResponse.json({ warning: 'Nenhum hunter elegível pra essa vaga' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    void notifyUsers(
      hunters.map(h => h.user_id),
      {
        type: 'job_opened',
        title: 'Nova vaga disponível',
        message: `${job.title}${job.companies?.name ? ` · ${job.companies.name}` : ''}${job.seniority ? ` · ${job.seniority}` : ''}`,
        link: `/hunter/vagas/${job.id}`,
      },
    )

    await Promise.all(hunters.map(h => {
      const u = h.users
      if (!u?.email) return null
      return notificarVagaLiberada({
        hunterEmail: u.email,
        hunterName: u.full_name ?? undefined,
        jobTitle: job.title,
        companyName: job.companies?.name || 'Empresa',
        seniority: job.seniority || undefined,
        location: job.location || undefined,
        workModel: job.work_model || undefined,
        salaryMin: job.salary_min || undefined,
        salaryMax: job.salary_max || undefined,
        jobId: job.id,
        appUrl,
      })
    }))

    return NextResponse.json({ success: true, sent: hunters.length, visibility: jobVisibility })
  } catch (err: unknown) {
    console.error('[notify-job-open] erro:', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}