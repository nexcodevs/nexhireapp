import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Retorna lista de company_ids que bloquearam o hunter atual.
 * Usado pra filtrar vagas que o hunter não deve ver.
 *
 * Implementação via RPC SECURITY DEFINER pra contornar RLS
 * (hunter não tem SELECT direto na tabela company_blocked_hunters).
 */
export async function getBlockedCompanyIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_blocked_company_ids_for_user', {
    user_uuid: userId,
  })

  if (error) {
    console.warn('[blocks:get-company-ids]', error)
    return []
  }

  if (!data) return []
  return (data as Array<{ company_id?: string } | string>).map(row =>
    typeof row === 'string' ? row : (row.company_id ?? ''),
  ).filter(Boolean)
}
