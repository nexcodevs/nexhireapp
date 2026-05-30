import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import AuditRow from './AuditRow'

export const metadata = {
  title: 'Audit log — Admin Nexhire',
}

interface AuditRowData {
  id: string
  actor_id: string | null
  actor_role: string | null
  action: string
  target_type: string
  target_id: string | null
  payload: Record<string, unknown> | null
  created_at: string
  actor: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null
}

const actionBadge: Record<string, 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple'> = {
  approved: 'green',
  rejected: 'red',
  hired: 'green',
  pending: 'yellow',
  suspended: 'gray',
  blocked: 'red',
  unblocked: 'green',
  sent_to_client: 'blue',
  published: 'green',
  created: 'gray',
  updated: 'blue',
  deleted: 'red',
  recomputed: 'blue',
  password_reset_requested: 'gray',
  ai_auto_approve: 'green',
  ai_needs_review: 'yellow',
  ai_reject: 'red',
}

export default async function AdminAuditPage() {
  const supabase = createAdminClient()

  const { data: eventsRaw } = await supabase
    .from('audit_events')
    .select(
      'id, actor_id, actor_role, action, target_type, target_id, payload, created_at, actor:users!audit_events_actor_id_fkey(full_name, email)',
    )
    .order('created_at', { ascending: false })
    .limit(200)

  const events = (eventsRaw ?? []) as AuditRowData[]

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Admin Nexhire"
        title="Audit"
        titleAccent="log"
        subtitle={`${events.length} eventos · click numa linha pra expandir o payload`}
      />

      {events.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
              Nenhum evento registrado ainda.
            </p>
            <p
              style={{
                fontSize: '11.5px',
                color: 'var(--text-4)',
                marginTop: '6px',
              }}
            >
              Eventos aparecem conforme ações são realizadas na plataforma.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          {/* Header da tabela */}
          <div
            style={{
              padding: '10px 22px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) auto minmax(0, 2fr) auto',
              gap: '12px',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-1)',
              fontFamily: 'var(--font-mono)',
              fontSize: '9.5px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
            }}
          >
            <span>Quem</span>
            <span>Ação</span>
            <span>Alvo</span>
            <span style={{ textAlign: 'right' }}>Quando</span>
          </div>

          {events.map(e => {
            const actor = Array.isArray(e.actor) ? e.actor[0] : e.actor
            const actorName = actor?.full_name || actor?.email || 'Sistema'
            const verb = e.action.split('.').pop() || ''
            const variant = actionBadge[verb] ?? actionBadge[e.action] ?? 'gray'
            return (
              <AuditRow
                key={e.id}
                actorName={actorName}
                actorRole={e.actor_role}
                action={e.action}
                targetType={e.target_type}
                targetId={e.target_id}
                payload={e.payload}
                timestamp={e.created_at}
                variant={variant}
              />
            )
          })}
        </Card>
      )}
    </div>
  )
}
