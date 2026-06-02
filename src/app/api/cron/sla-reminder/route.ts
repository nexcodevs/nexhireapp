import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUsers } from '@/lib/notifications'
import { logAudit } from '@/lib/audit'

const HR_STALE_DAYS = 3
const CLIENT_STALE_DAYS = 5

/**
 * Cron diário: avisa quem precisa decidir candidatos parados.
 * - Submissions em submitted/ai_analyzed há > 3d → notifica HR/admin
 * - Submissions em sent_to_client há > 5d → notifica company_users da empresa dona
 *
 * Vercel chama com Authorization: Bearer <CRON_SECRET>. Validamos pra
 * impedir invocação manual de fora.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = Date.now()
  const hrCutoff = new Date(now - HR_STALE_DAYS * 86_400_000).toISOString()
  const clientCutoff = new Date(now - CLIENT_STALE_DAYS * 86_400_000).toISOString()

  // === LEMBRETE HR ===
  const { data: staleForHr } = await admin
    .from('submissions')
    .select('id, candidates(full_name), jobs(title)')
    .in('status', ['submitted', 'ai_analyzed'])
    .lt('submitted_at', hrCutoff)
    .returns<{ id: string; candidates: { full_name: string | null } | null; jobs: { title: string | null } | null }[]>()

  let hrNotified = 0
  if (staleForHr && staleForHr.length > 0) {
    const { data: hrs } = await admin
      .from('users')
      .select('id')
      .in('role', ['hr_manager', 'admin'])

    const hrIds = (hrs ?? []).map(h => h.id)
    if (hrIds.length > 0) {
      await notifyUsers(hrIds, {
        type: 'new_submission',
        title: `${staleForHr.length} candidato${staleForHr.length === 1 ? '' : 's'} aguardando curadoria`,
        message: `Há ${HR_STALE_DAYS}+ dias sem decisão. Abra a fila e priorize.`,
        link: '/hr/submissoes',
      })
      hrNotified = hrIds.length
    }
  }

  // === LEMBRETE EMPRESA ===
  const { data: staleForClient } = await admin
    .from('submissions')
    .select('id, sent_to_client_at, jobs(company_id, title), candidates(full_name)')
    .eq('status', 'sent_to_client')
    .lt('sent_to_client_at', clientCutoff)
    .returns<{ id: string; sent_to_client_at: string; jobs: { company_id: string; title: string | null } | null; candidates: { full_name: string | null } | null }[]>()

  const byCompany = new Map<string, number>()
  for (const s of staleForClient ?? []) {
    const cid = s.jobs?.company_id
    if (!cid) continue
    byCompany.set(cid, (byCompany.get(cid) ?? 0) + 1)
  }

  let clientNotified = 0
  for (const [companyId, count] of byCompany) {
    const { data: members } = await admin
      .from('company_users')
      .select('user_id')
      .eq('company_id', companyId)

    const userIds = (members ?? []).map(m => m.user_id)
    if (userIds.length === 0) continue

    await notifyUsers(userIds, {
      type: 'candidate_sent_to_you',
      title: `${count} candidato${count === 1 ? '' : 's'} aguardando sua avaliação`,
      message: `Há ${CLIENT_STALE_DAYS}+ dias sem decisão. Abra a fila e priorize.`,
      link: '/empresa/candidatos',
    })
    clientNotified += userIds.length
  }

  await logAudit({
    actorId: null,
    actorRole: 'system',
    action: 'cron.sla_reminder',
    targetType: 'system',
    payload: {
      hr_stale: staleForHr?.length ?? 0,
      client_stale: staleForClient?.length ?? 0,
      hr_notified: hrNotified,
      client_notified: clientNotified,
    },
  })

  return NextResponse.json({
    ok: true,
    hr_stale: staleForHr?.length ?? 0,
    client_stale: staleForClient?.length ?? 0,
    hr_notified: hrNotified,
    client_notified: clientNotified,
  })
}
