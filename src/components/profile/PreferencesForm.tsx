'use client'

import { useCallback, useSyncExternalStore } from 'react'
import Card from '@/components/ui/Card'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'nexhire:theme'

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
    window.dispatchEvent(new Event('nexhire:theme-change'))
  } catch {
    // ignora
  }
}

function getCurrentTheme(): Theme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export default function PreferencesForm() {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener('storage', cb)
    window.addEventListener('nexhire:theme-change', cb)
    return () => {
      window.removeEventListener('storage', cb)
      window.removeEventListener('nexhire:theme-change', cb)
    }
  }, [])

  const theme = useSyncExternalStore(subscribe, getCurrentTheme, () => 'light' as Theme)

  return (
    <Card padding="lg">
      <h2
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          marginBottom: '14px',
        }}
      >
        Preferências
      </h2>

      <div className="flex flex-col gap-5">
        {/* Tema */}
        <div>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-2)',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Tema
          </label>
          <div
            role="radiogroup"
            aria-label="Escolha do tema"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}
          >
            {(['light', 'dark'] as Theme[]).map(opt => {
              const selected = theme === opt
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => applyTheme(opt)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border-1)'}`,
                    background: selected ? 'var(--accent-bg)' : 'var(--bg-elev-1)',
                    color: selected ? 'var(--accent-text)' : 'var(--text-2)',
                    fontSize: '13px',
                    fontWeight: selected ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all .15s var(--ease)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span aria-hidden style={{ fontSize: '16px' }}>
                      {opt === 'light' ? '☀️' : '🌙'}
                    </span>
                    <span>{opt === 'light' ? 'Claro' : 'Escuro'}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-4)',
                      marginTop: '4px',
                    }}
                  >
                    {opt === 'light'
                      ? 'Interface mais clara, melhor com luz ambiente.'
                      : 'Interface escura, melhor em luz baixa.'}
                  </div>
                </button>
              )
            })}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '8px' }}>
            Mudança aplica imediatamente. Persiste neste navegador.
          </p>
        </div>

        {/* Idioma */}
        <div>
          <label
            htmlFor="language"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-2)',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Idioma
          </label>
          <select
            id="language"
            value="pt-BR"
            disabled
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border-1)',
              background: 'var(--bg-elev-1)',
              color: 'var(--text-2)',
              fontSize: '13px',
            }}
          >
            <option value="pt-BR">Português (Brasil)</option>
          </select>
          <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '6px' }}>
            Outros idiomas em breve (English, Español).
          </p>
        </div>
      </div>
    </Card>
  )
}
