'use client'

import { useId, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ACCEPTED_MIME = 'application/pdf'

interface CVUploadProps {
  value?: string | null
  onUploaded: (storagePath: string, fileName: string) => void
  onRemoved?: () => void
  disabled?: boolean
  required?: boolean
  label?: string
}

export default function CVUpload({
  value,
  onUploaded,
  onRemoved,
  disabled,
  required,
  label = 'Currículo (PDF)',
}: CVUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const helperId = `${id}-hint`
  const errorId = `${id}-error`

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const hasValue = !!value

  function validateFile(file: File): string | null {
    if (file.type !== ACCEPTED_MIME) {
      return 'Apenas arquivos PDF são aceitos.'
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'Arquivo muito grande. Máximo de 5MB.'
    }
    return null
  }

  async function handleFile(file: File) {
    setError('')

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Sessão expirada. Faça login novamente.')
      setUploading(false)
      return
    }

    const storagePath = `${user.id}/${crypto.randomUUID()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(storagePath, file, {
        contentType: ACCEPTED_MIME,
        upsert: false,
      })

    if (uploadError) {
      console.error('[cv-upload]', uploadError)
      setError('Não foi possível enviar o currículo. Tente novamente.')
      setUploading(false)
      return
    }

    setFileName(file.name)
    setUploading(false)
    onUploaded(storagePath, file.name)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // permite re-selecionar mesmo arquivo
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading || hasValue) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    setFileName(null)
    setError('')
    onRemoved?.()
  }

  function openPicker() {
    if (disabled || uploading || hasValue) return
    inputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--color-text2)',
        }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--danger-text)', marginLeft: '4px' }}>
            *
          </span>
        )}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_MIME}
        onChange={handleInputChange}
        disabled={disabled || uploading || hasValue}
        aria-describedby={error ? errorId : helperId}
        className="sr-only"
      />

      {hasValue ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'var(--color-m100)',
            border: '1px solid var(--color-border-g)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              style={{ stroke: 'var(--color-g600)', flexShrink: 0 }}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span
              style={{
                fontSize: '13px',
                color: 'var(--color-text)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fileName || 'Currículo enviado'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remover currículo"
            style={{
              fontSize: '12px',
              color: 'var(--color-muted)',
              fontWeight: 500,
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            className="hover:underline"
          >
            Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={e => {
            e.preventDefault()
            if (!disabled && !uploading) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={disabled || uploading}
          aria-describedby={error ? errorId : helperId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px',
            borderRadius: '12px',
            border: `1.5px dashed ${dragOver ? 'var(--color-g600)' : 'var(--color-border)'}`,
            background: dragOver ? 'var(--color-m100)' : 'var(--color-surf)',
            cursor: disabled || uploading ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {uploading ? (
            <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              Enviando currículo…
            </span>
          ) : (
            <>
              <svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                style={{ stroke: 'var(--color-muted)' }}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                }}
              >
                Arraste o PDF ou clique para selecionar
              </span>
            </>
          )}
        </button>
      )}

      {error ? (
        <p id={errorId} role="alert" style={{ fontSize: '12px', color: 'var(--danger-text)', marginTop: '2px' }}>
          {error}
        </p>
      ) : (
        <p id={helperId} style={{ fontSize: '12px', color: 'var(--color-subtle)', marginTop: '2px' }}>
          PDF até 5MB. {required ? 'Obrigatório para envio.' : 'Ajuda a IA a analisar com mais precisão.'}
        </p>
      )}
    </div>
  )
}
