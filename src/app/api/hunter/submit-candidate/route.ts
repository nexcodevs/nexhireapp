import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ExtractedProfile {
  skills?: string[]
  languages?: unknown[]
  certifications?: string[]
  years_experience?: number | null
}

interface CandidateInput {
  full_name: string
  email?: string
  phone?: string
  linkedin_url?: string
  current_title?: string
  location?: string
}

interface SubmissionInput {
  interview_summary: string
  jd_priorities: string
  hunter_score: number
  hunter_score_rationale: string
}

interface SubmitBody {
  jobId: string
  cvPath: string
  candidate: CandidateInput
  submission: SubmissionInput
  extractedProfile?: ExtractedProfile | null
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = (await request.json()) as Partial<SubmitBody>

    if (!body.jobId || !body.cvPath || !body.candidate || !body.submission) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Confere se o user é recruiter aprovado
    const { data: recruiter } = await admin
      .from('recruiters')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!recruiter) {
      return NextResponse.json(
        { error: 'Perfil de hunter não encontrado.' },
        { status: 403 },
      )
    }

    if (recruiter.status !== 'approved') {
      return NextResponse.json(
        { error: 'Hunter ainda não aprovado para envios.' },
        { status: 403 },
      )
    }

    const candidate = body.candidate
    const profile = body.extractedProfile ?? null

    // Procura candidato existente (por email)
    let candidateId: string | null = null
    if (candidate.email) {
      const { data: existing } = await admin
        .from('candidates')
        .select('id, cv_url')
        .eq('email', candidate.email)
        .maybeSingle()

      if (existing) {
        candidateId = existing.id

        // Já submetido nessa vaga?
        const { data: dupSubmission } = await admin
          .from('submissions')
          .select('id')
          .eq('job_id', body.jobId)
          .eq('candidate_id', existing.id)
          .maybeSingle()

        if (dupSubmission) {
          return NextResponse.json(
            { error: 'Este candidato já foi enviado para esta vaga.' },
            { status: 409 },
          )
        }

        // Atualiza CV e dados extraídos
        const updatePayload: Record<string, unknown> = {}
        if (body.cvPath && !existing.cv_url) updatePayload.cv_url = body.cvPath
        if (profile) {
          if (profile.skills && profile.skills.length > 0) updatePayload.skills = profile.skills
          if (profile.languages && profile.languages.length > 0) updatePayload.language_proficiency = profile.languages
          if (profile.certifications && profile.certifications.length > 0) updatePayload.certifications = profile.certifications
          if (profile.years_experience !== undefined && profile.years_experience !== null) {
            updatePayload.years_experience = profile.years_experience
          }
          updatePayload.cv_extracted_at = new Date().toISOString()
        }
        if (Object.keys(updatePayload).length > 0) {
          await admin.from('candidates').update(updatePayload).eq('id', existing.id)
        }
      }
    }

    // Cria candidato novo se não existe
    if (!candidateId) {
      const newId = crypto.randomUUID()
      const { error: candError } = await admin.from('candidates').insert({
        id: newId,
        full_name: candidate.full_name,
        email: candidate.email || null,
        phone: candidate.phone || null,
        linkedin_url: candidate.linkedin_url || null,
        current_title: candidate.current_title || null,
        location: candidate.location || null,
        cv_url: body.cvPath,
        skills: profile?.skills ?? [],
        language_proficiency: profile?.languages ?? [],
        certifications: profile?.certifications ?? [],
        years_experience: profile?.years_experience ?? null,
        cv_extracted_at: profile ? new Date().toISOString() : null,
      })

      if (candError) {
        console.error('[submit-candidate:create-candidate]', candError)
        return NextResponse.json(
          { error: candError.message || 'Erro ao cadastrar candidato.' },
          { status: 500 },
        )
      }
      candidateId = newId
    }

    // Cria submissão
    const ownership = new Date()
    ownership.setDate(ownership.getDate() + 60)
    const submissionId = crypto.randomUUID()

    const { error: subError } = await admin.from('submissions').insert({
      id: submissionId,
      job_id: body.jobId,
      candidate_id: candidateId,
      recruiter_id: recruiter.id,
      interview_summary: body.submission.interview_summary,
      jd_priorities: body.submission.jd_priorities,
      hunter_score: body.submission.hunter_score,
      hunter_score_rationale: body.submission.hunter_score_rationale,
      ownership_expires_at: ownership.toISOString(),
    })

    if (subError) {
      console.error('[submit-candidate:create-submission]', subError)
      return NextResponse.json(
        { error: subError.message || 'Erro ao criar submissão.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ submissionId })
  } catch (error) {
    console.error('[submit-candidate]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
