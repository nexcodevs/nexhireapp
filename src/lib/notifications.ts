import { createAdminClient } from '@/lib/supabase/admin'

export type NotificationType =
  | 'new_submission'        // HR: hunter enviou candidato
  | 'job_opened'            // Hunter: vaga abriu pro marketplace
  | 'candidate_sent_to_you' // Empresa: HR enviou candidato
  | 'client_decision'       // Hunter/HR: cliente decidiu
  | 'submission_approved'   // Hunter: HR aprovou
  | 'submission_rejected'   // Hunter: HR reprovou
  | 'interview_scheduled'   // Hunter/HR: entrevista marcada
  | 'hired'                 // Hunter/HR: candidato contratado

export interface NotifyInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
}

/**
 * Insere notificação in-app pro user. Fail-safe: não interrompe o fluxo
 * em caso de erro — apenas warna.
 */
export async function notifyUser(input: NotifyInput): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    })
    if (error) {
      console.warn('[notify] insert falhou:', error.message)
    }
  } catch (err) {
    console.warn('[notify] exception:', err)
  }
}

/**
 * Versão batch — insere notificações pra vários users com mesmo payload.
 */
export async function notifyUsers(
  userIds: string[],
  payload: Omit<NotifyInput, 'userId'>,
): Promise<void> {
  if (userIds.length === 0) return
  try {
    const admin = createAdminClient()
    const rows = userIds.map(uid => ({
      user_id: uid,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link ?? null,
    }))
    const { error } = await admin.from('notifications').insert(rows)
    if (error) {
      console.warn('[notify-batch] insert falhou:', error.message)
    }
  } catch (err) {
    console.warn('[notify-batch] exception:', err)
  }
}
