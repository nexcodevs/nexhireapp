import { createClient } from '@/lib/supabase/server'
import { prefillSubmission } from '@/lib/ai/analyze'
import { parseCV } from '@/lib/ai/parseCV'
import { NextResponse } from 'next/server'

interface JobRow {
  id: string
  title: string
  seniority: string | null
  description: string | null
  status: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = (await request.json()) as { jobId?: unknown; cvPath?: unknown }
    const jobId = typeof body.jobId === 'string' ? body.jobId : ''
    const cvPath = typeof body.cvPath === 'string' ? body.cvPath : ''

    if (!jobId || !cvPath) {
      return NextResponse.json(
        { error: 'jobId e cvPath são obrigatórios.' },
        { status: 400 },
      )
    }

    // Confere se a vaga existe e está aberta
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, seniority, description, status')
      .eq('id', jobId)
      .single<JobRow>()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 })
    }

    if (job.status !== 'open_for_hunters') {
      return NextResponse.json(
        { error: 'Vaga não está aberta para envio.' },
        { status: 422 },
      )
    }

    // Baixa e parseia o CV
    const { data: blob, error: downloadError } = await supabase.storage
      .from('cvs')
      .download(cvPath)

    if (downloadError || !blob) {
      console.warn('[prefill:cv-download]', downloadError)
      return NextResponse.json(
        { error: 'Não foi possível ler o CV. Tente reenviar.' },
        { status: 422 },
      )
    }

    let cvText = ''
    try {
      const buffer = Buffer.from(await blob.arrayBuffer())
      cvText = await parseCV(buffer)
    } catch (parseError) {
      console.warn('[prefill:cv-parse]', parseError)
      return NextResponse.json(
        { error: 'Não conseguimos extrair texto do CV.' },
        { status: 422 },
      )
    }

    if (cvText.trim().length < 100) {
      return NextResponse.json(
        { error: 'CV muito curto pra análise. Verifique se é o arquivo certo.' },
        { status: 422 },
      )
    }

    const suggestion = await prefillSubmission({
      jobTitle: job.title,
      jobDescription: job.description ?? '',
      seniority: job.seniority ?? '',
      cvText,
    })

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('[prefill]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
