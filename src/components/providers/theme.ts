'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'nexhire:theme'

export type Theme = 'light' | 'dark'

type Listener = (theme: Theme) => void
const listeners = new Set<Listener>()

function readThemeFromDOM(): Theme {
  if (typeof window === 'undefined') return 'light'
  const attr = window.document.documentElement.getAttribute('data-theme')
  return attr === 'dark' ? 'dark' : 'light'
}

export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignora
  }
  window.document.documentElement.setAttribute('data-theme', theme)
  listeners.forEach(cb => cb(theme))
}

export function toggleTheme(): void {
  if (typeof window === 'undefined') return
  const current = readThemeFromDOM()
  setTheme(current === 'dark' ? 'light' : 'dark')
}

/**
 * Hook que retorna o tema atual e re-renderiza quando muda.
 * Sincroniza com o atributo `data-theme` do <html> via listener interno.
 */
export function useTheme(): Theme {
  const [theme, setLocalTheme] = useState<Theme>('light')

  useEffect(() => {
    // Sincroniza com o estado real do DOM logo após mount.
    // Esse setState inicial é necessário pra reler o atributo após hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalTheme(readThemeFromDOM())

    const listener: Listener = next => {
      setLocalTheme(next)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return theme
}
