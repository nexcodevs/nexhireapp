import { createAdminClient } from '@/lib/supabase/admin'

export interface AuditLogInput {
  actorId: string | null
  actorRole?: string | null
  action: string
  targetType: string
  targetId?: string | null
  payload?: Record<string, unknown>
  ip?: string | null
  userAgent?: string | null
}

/**
 * Registra um evento no audit log. Usa service_role pra contornar RLS.
 * NÃO bloqueia o fluxo: falha de audit é logada mas não propaga.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_events').insert({
      actor_id: input.actorId,
      actor_role: input.actorRole ?? null,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      payload: input.payload ?? null,
      ip_address: input.ip ?? null,
      user_agent: input.userAgent ?? null,
    })
    if (error) {
      console.warn('[audit] falha ao inserir:', error.message)
    }
  } catch (err) {
    console.warn('[audit] exception:', err)
  }
}
