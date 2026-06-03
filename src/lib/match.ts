/**
 * Score simples de fit entre candidato e vaga, baseado na intersecção
 * de skills. Required vale 70%, desired 30%. Retorna 0–100, ou null
 * quando a vaga não tem skills cadastradas (sem como medir).
 *
 * Não usa embeddings — só keyword matching com normalização básica.
 * Para upgrade futuro: synonyms (ex: "JS" ≡ "JavaScript") + embeddings
 * via Voyage AI (já temos infra).
 */

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

function pickStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map(normalize)
}

export function matchScore(
  candidateSkills: string[],
  jobRequiredSkills: unknown,
  jobDesiredSkills: unknown,
): number | null {
  const required = pickStringArray(jobRequiredSkills)
  const desired = pickStringArray(jobDesiredSkills)

  if (required.length === 0 && desired.length === 0) return null

  const userSet = new Set(candidateSkills.map(normalize))

  const reqMatch = required.filter(s => userSet.has(s)).length
  const desMatch = desired.filter(s => userSet.has(s)).length

  const reqPct = required.length === 0 ? 1 : reqMatch / required.length
  const desPct = desired.length === 0 ? 1 : desMatch / desired.length

  const weighted = reqPct * 0.7 + desPct * 0.3
  return Math.round(weighted * 100)
}

export function matchScoreVariant(score: number | null): 'green' | 'yellow' | 'gray' {
  if (score === null) return 'gray'
  if (score >= 70) return 'green'
  if (score >= 40) return 'yellow'
  return 'gray'
}

export function matchScoreLabel(score: number | null): string {
  if (score === null) return 'Sem dados'
  if (score >= 70) return `${score}% match`
  if (score >= 40) return `${score}% parcial`
  return `${score}% baixo`
}
