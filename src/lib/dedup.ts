/**
 * Normalização e detecção de candidatos duplicados.
 * Foco: email, telefone, LinkedIn — sinais determinísticos.
 * Fuzzy de nome fica de fora (pede pg_trgm + tuning extra).
 */

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim().toLowerCase()
  if (trimmed.length === 0 || !trimmed.includes('@')) return null
  return trimmed
}

/** Mantém só dígitos. "(11) 99999-9999" → "11999999999" */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D+/g, '')
  if (digits.length < 8) return null
  // Remove código país BR comum
  if (digits.length === 13 && digits.startsWith('55')) return digits.slice(2)
  return digits
}

/**
 * Extrai username canônico do LinkedIn.
 * "https://linkedin.com/in/Joao-Silva/" → "joao-silva"
 * "linkedin.com/in/joao-silva" → "joao-silva"
 * Retorna null se não bater no formato esperado.
 */
export function normalizeLinkedin(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim().toLowerCase()
  if (trimmed.length === 0) return null
  const match = trimmed.match(/linkedin\.com\/in\/([a-z0-9-_]+)/i)
  if (!match) return null
  return match[1].replace(/\/$/, '')
}

export interface DedupSignals {
  email: string | null
  phone: string | null
  linkedinUsername: string | null
}

export function buildDedupSignals(input: {
  email?: string | null
  phone?: string | null
  linkedin_url?: string | null
}): DedupSignals {
  return {
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone),
    linkedinUsername: normalizeLinkedin(input.linkedin_url),
  }
}
