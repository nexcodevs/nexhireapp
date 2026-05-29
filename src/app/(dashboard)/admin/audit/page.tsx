import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

export const metadata = {
  title: 'Audit log — Admin Nexhire',
}

interface AuditRow {
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
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default async function AdminAuditPage() {
  const supabase = createAdminClient()

  const { data: eventsRaw } = await supabase
    .from('audit_events')
    .select(
      'id, actor_id, actor_role, action, target_type, target_id, payload, created_at, actor:users!audit_events_actor_id_fkey(full_name, email)',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  const events = (eventsRaw ?? []) as AuditRow[]

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Admin Nexhire"
        title="Audit"
        titleAccent="log"
        subtitle="Registro imutável de ações sensíveis. Últimos 100 eventos."
      />

      {events.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>
              Nenhum evento registrado ainda.
            </p>
            <p
              style={{
                fontSize: '11.5px',
                color: 'var(--text-4)',
                marginTop: '6px',
              }}
            >
              Eventos aparecem conforme ações vão sendo realizadas na plataforma.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          {events.map(e => {
            const actor = Array.isArray(e.actor) ? e.actor[0] : e.actor
            const actorName = actor?.full_name || actor?.email || 'Sistema'
            const verb = e.action.split('.').pop() || ''
            const variant = actionBadge[verb] ?? 'gray'
            return (
              <div
                key={e.id}
                style={{
                  padding: '14px 22px',
                  borderBottom: '1px solid var(--border-1)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <Avatar name={actorName} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: 'var(--text-1)',
                      }}
                    >
                      {actorName}
                    </span>
                    {e.actor_role && (
                      <Badge variant="gray" size="sm">
                        {e.actor_role}
                      </Badge>
                    )}
                    <Badge variant={variant} size="sm">
                      {e.action}
                    </Badge>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-3)',
                      marginTop: '4px',
                      lineHeight: 1.5,
                    }}
                  >
                    {e.target_type}
                    {e.target_id && ` · ${e.target_id.slice(0, 8)}…`}
                  </div>
                  {e.payload && Object.keys(e.payload).length > 0 && (
                    <pre
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--text-3)',
                        background: 'var(--bg-elev-2)',
                        border: '1px solid var(--border-1)',
                        borderRadius: 'var(--r-sm)',
                        padding: '8px 10px',
                        marginTop: '8px',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  )}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--text-4)',
                    flexShrink: 0,
                    textAlign: 'right',
                  }}
                >
                  {formatTimestamp(e.created_at)}
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
