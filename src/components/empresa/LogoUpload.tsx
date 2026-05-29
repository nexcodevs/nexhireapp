'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ACCEPTED_MIMES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']

interface LogoUploadProps {
  companyId: string
  value: string | null
  onUploaded: (path: string) => void
  onRemoved?: () => void
  disabled?: boolean
}

export default function LogoUpload({
  companyId,
  value,
  onUploaded,
  onRemoved,
  disabled,
}: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const publicUrl = useMemo(() => {
    if (!value) return null
    const supabase = createClient()
    return supabase.storage.from('company_logos').getPublicUrl(value).data.publicUrl
  }, [value])

  function validate(file: File): string | null {
    if (!ACCEPTED_MIMES.includes(file.type)) {
      return 'Formato não suportado. Use PNG, JPG, WEBP ou SVG.'
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'Imagem maior que 2MB.'
    }
    return null
  }

  async function handleFile(file: File) {
    setError('')
    const v = validate(file)
    if (v) {
      setError(v)
      return
    }
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${companyId}/logo-${new Date().getTime()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('company_logos')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) {
      console.error('[logo-upload]', upErr)
      setError('Não foi possível enviar a logo. Tente novamente.')
      setUploading(false)
      return
    }
    setUploading(false)
    onUploaded(path)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ''
  }

  function handleRemove() {
    setError('')
    onRemoved?.()
  }

  function openPicker() {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-2">
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text2)' }}>
        Logo da empresa
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIMES.join(',')}
        onChange={handleInputChange}
        disabled={disabled || uploading}
        className="sr-only"
      />
      <div className="flex items-center gap-3">
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: 'var(--r-md)',
            background: 'var(--bg-elev-1)',
            border: '1px solid var(--border-1)',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {publicUrl ? (
            <Image
              src={publicUrl}
              alt="Logo"
              width={72}
              height={72}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              unoptimized
            />
          ) : (
            <span
              className="mono"
              style={{
                fontSize: '9px',
                color: 'var(--text-4)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              sem logo
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled || uploading}
            className="nx-btn nx-btn--glass nx-btn--size-md"
            style={{ alignSelf: 'flex-start' }}
          >
            {uploading
              ? 'Enviando…'
              : publicUrl
                ? 'Trocar logo'
                : 'Enviar logo'}
          </button>
          {publicUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-3)',
                fontSize: '12px',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                alignSelf: 'flex-start',
              }}
            >
              Remover
            </button>
          )}
        </div>
      </div>
      <p style={{ fontSize: '11.5px', color: 'var(--color-subtle)' }}>
        PNG, JPG, WEBP ou SVG até 2MB. Aparece nos cards de vaga vistos pelos hunters.
      </p>
      {error && (
        <p role="alert" style={{ fontSize: '12px', color: 'var(--danger-text)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
