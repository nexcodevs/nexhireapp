import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkDailyAIQuota,
  DAILY_AI_LIMITS,
  logAIUsage,
} from '@/lib/ai/usage'

const MAX_BYTES = 24 * 1024 * 1024 // 24MB — Groq limit é 25MB
const ALLOWED_MIMES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/m4a',
  'audio/x-m4a',
]

export const maxDuration = 60 // segundos (Vercel limite serverless)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const quota = await checkDailyAIQuota(user.id, 'transcribe', DAILY_AI_LIMITS.transcribe)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário de transcrições atingido (${quota.used}/${quota.limit}). Tente novamente amanhã.`,
        },
        { status: 429 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('audio')

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Arquivo de áudio obrigatório.' }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Áudio vazio.' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Áudio maior que 24MB. Grave em pedaços menores.' },
        { status: 413 },
      )
    }

    const mimeType = file.type
    if (mimeType && !ALLOWED_MIMES.some(m => mimeType.startsWith(m.split('/')[0]))) {
      return NextResponse.json({ error: 'Formato de áudio não suportado.' }, { status: 415 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('[transcribe] GROQ_API_KEY ausente')
      return NextResponse.json({ error: 'Configuração de IA incompleta.' }, { status: 500 })
    }

    // Repassa pro Groq Whisper
    const groqForm = new FormData()
    groqForm.append('file', file, 'audio.webm')
    groqForm.append('model', 'whisper-large-v3-turbo')
    groqForm.append('language', 'pt')
    groqForm.append('response_format', 'json')

    const start = new Date().getTime()
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('[transcribe] Groq error:', res.status, errText)
      return NextResponse.json(
        { error: 'IA não conseguiu transcrever. Tente gravar de novo.' },
        { status: 502 },
      )
    }

    const data = (await res.json()) as { text?: string }
    const text = (data.text ?? '').trim()

    if (text.length === 0) {
      return NextResponse.json(
        { error: 'Não identificamos voz no áudio. Verifique o microfone.' },
        { status: 422 },
      )
    }

    // Whisper cobra por hora de áudio. Sem duração precisa, usamos bytes
    // como aproximação (1KB ≈ 1 token) só pra ter sinal de volume.
    void logAIUsage({
      userId: user.id,
      feature: 'transcribe',
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
      inputTokens: Math.round(file.size / 1024),
      outputTokens: 0,
      durationMs: new Date().getTime() - start,
      metadata: { file_size_bytes: file.size, mime: mimeType },
    })

    return NextResponse.json({ text })
  } catch (error) {
    console.error('[transcribe]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
