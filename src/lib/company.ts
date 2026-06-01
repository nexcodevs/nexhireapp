import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Garante que o user tem uma company vinculada.
 * Se não tem, cria empresa placeholder automaticamente (sem onboarding
 * bloqueante). User edita os dados depois em /empresa/configuracoes.
 *
 * O primeiro parâmetro (supabase) fica por compatibilidade dos callers
 * existentes mas não é usado mais — internamente usa admin client.
 */
export async function requireCompany(
  _supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('company_users')
    .select('company_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.company_id) {
    return existing.company_id
  }

  // Não tem company → cria placeholder com nome do user
  const { data: userData } = await admin
    .from('users')
    .select('full_name, email')
    .eq('id', userId)
    .single()

  const placeholderName = userData?.full_name
    ? `Empresa de ${userData.full_name.split(' ')[0]}`
    : userData?.email
      ? `Empresa de ${userData.email.split('@')[0]}`
      : 'Minha empresa'

  const companyId = crypto.randomUUID()
  const { error: companyError } = await admin.from('companies').insert({
    id: companyId,
    name: placeholderName,
  })
  if (companyError) {
    console.error('[requireCompany:create-company]', companyError)
    throw new Error('Não foi possível inicializar a empresa.')
  }

  const { error: linkError } = await admin.from('company_users').insert({
    id: crypto.randomUUID(),
    company_id: companyId,
    user_id: userId,
    role: 'owner',
    tos_accepted_at: new Date().toISOString(),
    tos_version: '2026-05-29',
  })
  if (linkError) {
    console.error('[requireCompany:link]', linkError)
    // Cleanup
    await admin.from('companies').delete().eq('id', companyId)
    throw new Error('Não foi possível vincular você à empresa.')
  }

  return companyId
}
