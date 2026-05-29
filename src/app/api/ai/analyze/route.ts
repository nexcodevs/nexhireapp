import { createClient } from '@/lib/supabase/server'
import { analyzeCandidate } from '@/lib/ai/analyze'
import { parseCV } from '@/lib/ai/parseCV'
import { NextResponse } from 'next/server'

interface SubmissionWithRelations {
  id: string
  interview_summary: string | null
  jd_priorities: string | null
  hunter_score: number | null
  hunter_score_rationale: string | null
  candidates: {
    full_name: string
    current_title: string | null
    cv_url: string | null
  } | null
  jobs: {
    title: string
    seniority: string | null
    description: string | null
  } | null
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await request.json()

    if (!submissionId || typeof submissionId !== 'string') {
      return NextResponse.json({ error: 'submissionId obrigatório.' }, { status: 400 })
    }

    const { data: sub, error: subError } = await supabase
      .from('submissions')
      .select('id, interview_summary, jd_priorities, hunter_score, hunter_score_rationale, candidates(full_name, current_title, cv_url), jobs(title, seniority, description)')
      .eq('id', submissionId)
      .single<SubmissionWithRelations>()

    if (subError || !sub) {
      return NextResponse.json({ error: 'Submissão não encontrada.' }, { status: 404 })
    }

    const { jobs: job, candidates: candidate } = sub
    if (!job || !candidate) {
      return NextResponse.json({ error: 'Dados incompletos na submissão.' }, { status: 422 })
    }

    let cvText: string | null = null
    if (candidate.cv_url) {
      const { data: blob, error: downloadError } = await supabase.storage
        .from('cvs')
        .download(candidate.cv_url)

      if (downloadError) {
        console.warn('[ai-analyze:cv-download]', downloadError)
      } else if (blob) {
        try {
          const buffer = Buffer.from(await blob.arrayBuffer())
          cvText = await parseCV(buffer)
        } catch (parseError) {
          console.warn('[ai-analyze:cv-parse]', parseError)
        }
      }
    }

    const analysis = await analyzeCandidate({
      jobTitle: job.title,
      jobDescription: job.description ?? '',
      seniority: job.seniority ?? '',
      candidateName: candidate.full_name,
      candidateTitle: candidate.current_title ?? '',
      interviewSummary: sub.interview_summary ?? '',
      cvText,
      jdPriorities: sub.jd_priorities,
      hunterScore: sub.hunter_score,
      hunterScoreRationale: sub.hunter_score_rationale,
    })

    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'ai_analyzed',
        ai_score: analysis.score_geral,
        ai_summary: analysis.resumo,
        ai_risks: analysis.riscos,
        ai_gaps: analysis.gaps,
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('[ai-analyze:db-update]', updateError)
      return NextResponse.json({ error: 'Não foi possível salvar a análise.' }, { status: 500 })
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('[ai-analyze]', error)
    return NextResponse.json({ error: 'Falha ao analisar candidato.' }, { status: 500 })
  }
}
