import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notificarVagaLiberada } from '@/lib/email/templates/vagaLiberada'
import { visibleTypesForLevel, type RecruiterLevel, type VisibilityType } from '@/lib/visibility'

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json()
    if (!jobId) return NextResponse.json({ error: 'jobId obrigatório' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createAdminClient()

    const { data: job, error } = await admin
      .from('jobs')
      .select(`id, title, seniority, location, work_model, salary_min, salary_max, visibility_type, companies ( name )`)
      .eq('id', jobId)
      .single()

    if (error || !job) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

    const jobVisibility = (job.visibility_type || 'open') as VisibilityType

    // Define quais níveis podem ver a vaga
    const eligibleLevels: RecruiterLevel[] = []
    if (visibleTypesForLevel('beginner').includes(jobVisibility)) eligibleLevels.push('beginner')
    if (visibleTypesForLevel('specialist').includes(jobVisibility)) eligibleLevels.push('specialist')
    if (visibleTypesForLevel('top_hunter').includes(jobVisibility)) eligibleLevels.push('top_hunter')

    const { data: hunters } = await admin
      .from('recruiters')
      .select('user_id, level, users ( email, full_name )')
      .eq('status', 'approved')
      .in('level', eligibleLevels)

    if (!hunters || hunters.length === 0) {
      return NextResponse.json({ warning: 'Nenhum hunter elegível pra essa vaga' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    await Promise.all(hunters.map((h: any) => {
      const u = h.users
      if (!u?.email) return null
      return notificarVagaLiberada({
        hunterEmail: u.email,
        hunterName: u.full_name,
        jobTitle: job.title,
        companyName: (job.companies as any)?.name || 'Empresa',
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
  } catch (err: any) {
    console.error('[notify-job-open] erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}