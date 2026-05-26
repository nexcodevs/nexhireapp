import { createClient } from '@/lib/supabase/server'
import { analyzeCandidate } from '@/lib/ai/analyze'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await request.json()

    const { data: sub } = await supabase
      .from('submissions')
      .select('*, candidates(full_name, current_title), jobs(title, seniority, description)')
      .eq('id', submissionId)
      .single()

    if (!sub) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const job = sub.jobs as any
    const candidate = sub.candidates as any

    const analysis = await analyzeCandidate(
      job.description || '',
      job.title,
      job.seniority || '',
      sub.interview_summary || '',
      candidate.full_name,
      candidate.current_title || '',
    )

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
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}