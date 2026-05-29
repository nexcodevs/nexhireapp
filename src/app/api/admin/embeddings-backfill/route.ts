import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/ai/embed'

interface JobNoEmbedding {
  id: string
  title: string
  description: string | null
}

export const maxDuration = 300

/**
 * Backfill manual de embeddings pras vagas abertas sem embedding.
 * Só admin executa. Processa em lotes pequenos pra evitar timeout.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas admin.' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as { limit?: unknown }
    const limit = typeof body.limit === 'number' && body.limit > 0 ? Math.min(body.limit, 50) : 20

    const admin = createAdminClient()

    const { data: pending } = await admin
      .from('jobs')
      .select('id, title, description')
      .eq('status', 'open_for_hunters')
      .is('embedding', null)
      .limit(limit)

    const pendingJobs = (pending ?? []) as JobNoEmbedding[]
    if (pendingJobs.length === 0) {
      return NextResponse.json({ processed: 0, message: 'Nenhuma vaga pendente.' })
    }

    let processed = 0
    let failed = 0

    for (const job of pendingJobs) {
      try {
        const text = [job.title, job.description ?? ''].filter(Boolean).join('\n\n')
        const embedding = await embedText(text, 'document', {
          feature: 'embeddings_backfill',
          userId: user.id,
        })
        const { error } = await admin
          .from('jobs')
          .update({ embedding: embedding as unknown as string })
          .eq('id', job.id)
        if (error) {
          failed += 1
          console.warn(`[embeddings-backfill] update falhou ${job.id}:`, error.message)
        } else {
          processed += 1
        }
      } catch (err) {
        failed += 1
        console.warn(`[embeddings-backfill] embed falhou ${job.id}:`, err)
      }
    }

    return NextResponse.json({
      processed,
      failed,
      remaining_to_process: Math.max(0, pendingJobs.length - processed - failed),
    })
  } catch (error) {
    console.error('[embeddings-backfill]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
