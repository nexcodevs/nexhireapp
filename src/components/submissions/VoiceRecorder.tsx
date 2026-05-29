'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface VoiceRecorderProps {
  /** Chamado quando a transcrição termina. */
  onTranscribed: (text: string) => void
  /** Tempo máximo em segundos (default 300 = 5 min). */
  maxSeconds?: number
  disabled?: boolean
}

type Phase = 'idle' | 'recording' | 'processing' | 'error'

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VoiceRecorder({
  onTranscribed,
  maxSeconds = 300,
  disabled = false,
}: VoiceRecorderProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(0)

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanupStream()
      cleanupTimer()
    }
  }, [cleanupStream, cleanupTimer])

  async function transcribe(blob: Blob): Promise<void> {
    setPhase('processing')
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'memo.webm')

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error || 'IA não conseguiu transcrever.')
        setPhase('error')
        return
      }

      const { text } = (await res.json()) as { text: string }
      onTranscribed(text)
      setPhase('idle')
      setElapsed(0)
    } catch (err) {
      console.warn('[voice:transcribe]', err)
      setError('Falha de rede ao transcrever.')
      setPhase('error')
    }
  }

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Tenta usar audio/webm. Se não suportar, deixa o browser escolher.
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      chunksRef.current = []
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        cleanupStream()
        cleanupTimer()
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        transcribe(blob)
      }
      recorder.onerror = (e: Event) => {
        console.warn('[voice:recorder]', e)
        setError('Erro na gravação.')
        setPhase('error')
        cleanupStream()
        cleanupTimer()
      }

      recorderRef.current = recorder
      recorder.start()

      startedAtRef.current = new Date().getTime()
      setPhase('recording')
      setElapsed(0)

      timerRef.current = setInterval(() => {
        const seconds = Math.floor(
          (new Date().getTime() - startedAtRef.current) / 1000,
        )
        setElapsed(seconds)
        if (seconds >= maxSeconds) stopRecording()
      }, 500)
    } catch (err) {
      console.warn('[voice:start]', err)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Permissão de microfone negada. Libere no navegador e tente de novo.')
      } else {
        setError('Não foi possível acessar o microfone.')
      }
      setPhase('error')
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }

  function reset() {
    setError('')
    setPhase('idle')
    setElapsed(0)
  }

  if (phase === 'processing') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)',
          color: 'var(--accent-text)',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        <span
          aria-hidden
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        IA transcrevendo seu áudio…
      </div>
    )
  }

  if (phase === 'recording') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--r-md)',
        }}
      >
        <span
          aria-hidden
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'var(--danger-text)',
            animation: 'live-pulse 1.5s infinite',
          }}
        />
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--danger-text)',
            flex: 1,
          }}
        >
          Gravando · {formatSeconds(elapsed)} / {formatSeconds(maxSeconds)}
        </span>
        <button
          type="button"
          onClick={stopRecording}
          className="nx-btn nx-btn--primary nx-btn--size-sm"
        >
          Parar e transcrever
        </button>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--warning-bg)',
          border: '1px solid var(--warning-border)',
          borderRadius: 'var(--r-md)',
          color: 'var(--warning-text)',
          fontSize: '12.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'space-between',
        }}
      >
        <span>{error}</span>
        <button
          type="button"
          onClick={reset}
          style={{
            fontSize: '11.5px',
            background: 'transparent',
            border: 'none',
            color: 'var(--warning-text)',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          tentar de novo
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className="nx-btn nx-btn--glass nx-btn--size-sm"
      style={{ alignSelf: 'flex-start' }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
      Gravar resumo da entrevista
    </button>
  )
}
