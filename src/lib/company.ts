import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Busca o company_id do usuário company_user.
 * Se não tem company vinculada, redireciona pra onboarding.
 *
 * Usa admin client por dentro pra bypass RLS — o caller já validou
 * auth.getUser() e está passando userId confiável. Evita problemas
 * com policies de SELECT em company_users.
 *
 * O primeiro parâmetro (supabase) fica por compatibilidade dos callers
 * existentes mas não é usado mais.
 */
export async function requireCompany(
  _supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const admin = createAdminClient()
  const { data: companyUser } = await admin
    .from('company_users')
    .select('company_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!companyUser?.company_id) {
    redirect('/empresa/onboarding')
  }

  return companyUser.company_id
}
