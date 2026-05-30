'use client'

import { useId, useState } from 'react'

interface ChipsInputProps {
  label: string
  hint?: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  /** Cor das chips. */
  tone?: 'accent' | 'neutral' | 'attention' | 'danger'
  /** Máximo de chips permitidas. */
  max?: number
  disabled?: boolean
}

const tones = {
  accent: { bg: 'var(--accent-bg)', text: 'var(--accent-text)', border: 'var(--accent-border)' },
  neutral: { bg: 'var(--bg-elev-2)', text: 'var(--text-2)', border: 'var(--border-1)' },
  attention: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', border: 'var(--warning-border)' },
  danger: { bg: 'var(--danger-bg)', text: 'var(--danger-text)', border: 'var(--danger-border)' },
}

/**
 * Input controlado de tags/chips. Digite e Enter pra adicionar; X pra remover.
 * Usado pra skills obrigatórias/desejáveis, benefícios, etc.
 */
export default function ChipsInput({
  label,
  hint,
  value,
  onChange,
  placeholder = 'Digite e pressione Enter',
  tone = 'accent',
  max,
  disabled,
}: ChipsInputProps) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const colors = tones[tone]

  function addChip(text: string) {
    const t = text.trim()
    if (!t) return
    if (value.includes(t)) {
      setDraft('')
      return
    }
    if (max && value.length >= max) return
    onChange([...value, t])
    setDraft('')
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addChip(draft)
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault()
      addChip(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeAt(value.length - 1)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}
      >
        {label}
        {max && (
          <span style={{ color: 'var(--text-4)', fontWeight: 400, marginLeft: '6px' }}>
            ({value.length}/{max})
          </span>
        )}
      </label>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '8px',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-md)',
          minHeight: '42px',
        }}
      >
        {value.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 500,
              background: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 'var(--r-sm)',
              lineHeight: 1.2,
            }}
          >
            {chip}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remover ${chip}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.text,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '14px',
                  lineHeight: 1,
                  opacity: 0.7,
                }}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addChip(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled || (max ? value.length >= max : false)}
          style={{
            flex: '1 1 120px',
            minWidth: '120px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            color: 'var(--text-1)',
            padding: '4px',
          }}
        />
      </div>
      {hint && (
        <p style={{ fontSize: '11.5px', color: 'var(--text-4)', lineHeight: 1.4 }}>
          {hint}
        </p>
      )}
    </div>
  )
}
