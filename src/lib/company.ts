import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

/**
 * Busca o company_id do usuário company_user.
 * Se não tem company vinculada, redireciona pra onboarding.
 */
export async function requireCompany(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', userId)
    .single()

  if (!companyUser?.company_id) {
    redirect('/empresa/onboarding')
  }

  return companyUser.company_id
}
