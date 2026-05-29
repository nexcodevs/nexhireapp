import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { askAboutCandidate } from '@/lib/ai/analyze'
import { parseCV } from '@/lib/ai/parseCV'
import { checkDailyAIQuota, DAILY_AI_LIMITS } from '@/lib/ai/usage'

interface SubmissionWithRelations {
  id: string
  interview_summary: string | null
  ai_summary: string | null
  candidates: { full_name: string; cv_url: string | null } | null
  jobs: { title: string; description: string | null } | null
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const quota = await checkDailyAIQuota(user.id, 'ask_candidate', DAILY_AI_LIMITS.ask_candidate)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário de perguntas atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    const { submissionId, question } = (await request.json()) as {
      submissionId?: string
      question?: string
    }
    if (!submissionId || !question || question.trim().length < 5) {
      return NextResponse.json(
        { error: 'submissionId e question obrigatórios.' },
        { status: 400 },
      )
    }

    const { data: sub } = await supabase
      .from('submissions')
      .select(
        'id, interview_summary, ai_summary, candidates(full_name, cv_url), jobs(title, description)',
      )
      .eq('id', submissionId)
      .single<SubmissionWithRelations>()

    if (!sub || !sub.candidates || !sub.jobs) {
      return NextResponse.json({ error: 'Submissão não encontrada.' }, { status: 404 })
    }

    let cvText = ''
    if (sub.candidates.cv_url) {
      const { data: blob } = await supabase.storage
        .from('cvs')
        .download(sub.candidates.cv_url)
      if (blob) {
        try {
          const buffer = Buffer.from(await blob.arrayBuffer())
          cvText = await parseCV(buffer)
        } catch (err) {
          console.warn('[ask-candidate:cv-parse]', err)
        }
      }
    }

    const answer = await askAboutCandidate(
      {
        question: question.trim(),
        candidateName: sub.candidates.full_name,
        jobTitle: sub.jobs.title,
        jobDescription: sub.jobs.description ?? '',
        cvText,
        interviewSummary: sub.interview_summary,
        aiSummary: sub.ai_summary,
      },
      user.id,
    )

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('[ask-candidate]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
