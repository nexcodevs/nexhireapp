'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const SENIORITY_OPTIONS = ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista', 'Gerente', 'Diretor']
const MODEL_OPTIONS = ['Presencial', 'Híbrido', 'Remoto']
const TYPE_OPTIONS = ['CLT', 'PJ', 'Estágio', 'Freelance']

interface StatusOption {
  value: string
  label: string
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'pending_hr_review', label: 'Em revisão' },
  { value: 'open_for_hunters', label: 'Aberta' },
  { value: 'submission_closed', label: 'Envios fechados' },
  { value: 'in_hr_curation', label: 'Em curadoria' },
  { value: 'sent_to_client', label: 'Aguardando cliente' },
  { value: 'interviewing', label: 'Em entrevista' },
  { value: 'offer', label: 'Em proposta' },
  { value: 'hired', label: 'Contratado' },
  { value: 'closed', label: 'Encerrada' },
  { value: 'cancelled', label: 'Cancelada' },
]

interface JobFiltersProps {
  resultsLabel?: string
  showStatus?: boolean
  showSeniority?: boolean
  showModel?: boolean
  showType?: boolean
  showHideSubmitted?: boolean
}

export default function JobFilters({
  resultsLabel,
  showStatus = false,
  showSeniority = true,
  showModel = true,
  showType = true,
  showHideSubmitted = false,
}: JobFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const status = searchParams.get('status')?.split(',').filter(Boolean) ?? []
  const seniority = searchParams.get('seniority')?.split(',').filter(Boolean) ?? []
  const model = searchParams.get('model')?.split(',').filter(Boolean) ?? []
  const type = searchParams.get('type')?.split(',').filter(Boolean) ?? []
  const hideSubmitted = searchParams.get('hideSubmitted') === '1'

  const activeCount =
    (showStatus ? status.length : 0) +
    (showSeniority ? seniority.length : 0) +
    (showModel ? model.length : 0) +
    (showType ? type.length : 0) +
    (showHideSubmitted && hideSubmitted ? 1 : 0)

  function navigate(spString: string) {
    startTransition(() => {
      router.push(spString ? `?${spString}` : '?', { scroll: false })
    })
  }

  function updateMulti(key: string, values: string[]) {
    const sp = new URLSearchParams(searchParams.toString())
    if (values.length > 0) sp.set(key, values.join(','))
    else sp.delete(key)
    navigate(sp.toString())
  }

  function toggleHide() {
    const sp = new URLSearchParams(searchParams.toString())
    if (hideSubmitted) sp.delete('hideSubmitted')
    else sp.set('hideSubmitted', '1')
    navigate(sp.toString())
  }

  function clearAll() {
    const keysToClear = ['status', 'seniority', 'model', 'type', 'hideSubmitted']
    const sp = new URLSearchParams(searchParams.toString())
    keysToClear.forEach(k => sp.delete(k))
    navigate(sp.toString())
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {showStatus && (
        <FilterChip
          label="Status"
          options={STATUS_OPTIONS}
          selected={status}
          onChange={values => updateMulti('status', values)}
        />
      )}
      {showSeniority && (
        <FilterChip
          label="Senioridade"
          options={SENIORITY_OPTIONS.map(v => ({ value: v, label: v }))}
          selected={seniority}
          onChange={values => updateMulti('seniority', values)}
        />
      )}
      {showModel && (
        <FilterChip
          label="Modelo"
          options={MODEL_OPTIONS.map(v => ({ value: v, label: v }))}
          selected={model}
          onChange={values => updateMulti('model', values)}
        />
      )}
      {showType && (
        <FilterChip
          label="Contrato"
          options={TYPE_OPTIONS.map(v => ({ value: v, label: v }))}
          selected={type}
          onChange={values => updateMulti('type', values)}
        />
      )}

      {showHideSubmitted && (
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 12px',
            borderRadius: '999px',
            border: `1px solid ${hideSubmitted ? 'var(--color-g600)' : 'var(--color-border)'}`,
            background: hideSubmitted ? 'var(--color-m100)' : 'var(--color-surf)',
            color: hideSubmitted ? 'var(--color-f900)' : 'var(--color-muted)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all .15s',
          }}
        >
          <input
            type="checkbox"
            checked={hideSubmitted}
            onChange={toggleHide}
            style={{
              width: '14px',
              height: '14px',
              accentColor: 'var(--color-g600)',
              margin: 0,
            }}
          />
          Esconder já enviadas
        </label>
      )}

      {resultsLabel && (
        <span
          style={{
            fontSize: '12.5px',
            color: 'var(--color-subtle)',
            marginLeft: activeCount > 0 ? 0 : 'auto',
          }}
        >
          {resultsLabel}
        </span>
      )}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          style={{
            marginLeft: 'auto',
            fontSize: '12.5px',
            color: 'var(--color-g600)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontWeight: 500,
          }}
          className="nx-clear-filters"
        >
          Limpar filtros ({activeCount})
        </button>
      )}

      <style>{`
        .nx-clear-filters:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

interface FilterChipProps {
  label: string
  options: StatusOption[]
  selected: string[]
  onChange: (values: string[]) => void
}

function FilterChip({ label, options, selected, onChange }: FilterChipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEsc)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    onChange(next)
  }

  const active = selected.length > 0

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 12px',
          borderRadius: '999px',
          border: `1px solid ${active ? 'var(--color-g600)' : 'var(--color-border)'}`,
          background: active ? 'var(--color-m100)' : 'var(--color-surf)',
          color: active ? 'var(--color-f900)' : 'var(--color-text)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        {label}
        {active && (
          <span
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              borderRadius: '999px',
              background: 'var(--color-g600)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            {selected.length}
          </span>
        )}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          aria-hidden
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '200px',
            maxHeight: '320px',
            overflowY: 'auto',
            background: 'var(--color-surf)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '6px',
            boxShadow: '0 8px 24px rgba(5, 46, 22, 0.12)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {options.map(opt => {
            const checked = selected.includes(opt.value)
            return (
              <label
                key={opt.value}
                role="option"
                aria-selected={checked}
                className="nx-filter-option"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background .12s',
                  whiteSpace: 'nowrap',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  style={{
                    width: '14px',
                    height: '14px',
                    accentColor: 'var(--color-g600)',
                    margin: 0,
                  }}
                />
                {opt.label}
              </label>
            )
          })}
        </div>
      )}

      <style>{`
        .nx-filter-option:hover {
          background: var(--color-m100);
        }
      `}</style>
    </div>
  )
}
