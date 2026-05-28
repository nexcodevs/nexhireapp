import type { SupabaseClient } from '@supabase/supabase-js'

export type RecruiterLevel = 'beginner' | 'specialist' | 'top_hunter'
export type VisibilityType = 'open' | 'specialist_plus' | 'top_hunters_only'

export function visibleTypesForLevel(level: RecruiterLevel | null | undefined): VisibilityType[] {
  switch (level) {
    case 'top_hunter':
      return ['open', 'specialist_plus', 'top_hunters_only']
    case 'specialist':
      return ['open', 'specialist_plus']
    case 'beginner':
    default:
      return ['open']
  }
}

/**
 * Filtra um array de jobs em memória pela visibilidade do hunter.
 * Vagas com visibility_type NULL são tratadas como 'open' (compatibilidade).
 */
export function filterJobsByVisibility<T extends { visibility_type?: string | null }>(
  jobs: T[] | null | undefined,
  level: RecruiterLevel | null | undefined
): T[] {
  if (!jobs) return []
  const allowedTypes = visibleTypesForLevel(level)
  return jobs.filter(job => {
    const type = (job.visibility_type || 'open') as VisibilityType
    return allowedTypes.includes(type)
  })
}

export async function getRecruiterLevel(
  supabase: SupabaseClient,
  userId: string
): Promise<RecruiterLevel | null> {
  const { data } = await supabase
    .from('recruiters')
    .select('level, status')
    .eq('user_id', userId)
    .single()

  if (!data || data.status !== 'approved') return null
  return (data.level as RecruiterLevel) || 'beginner'
}