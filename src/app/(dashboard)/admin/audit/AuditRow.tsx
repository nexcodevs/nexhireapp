'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'

interface AuditRowProps {
  actorName: string
  actorRole: string | null
  action: string
  targetType: string
  targetId: string | null
  payload: Record<string, unknown> | null
  timestamp: string
  variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple'
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Linha condensada de audit log. Click expande pra mostrar payload.
 */
export default function AuditRow({
  actorName,
  actorRole,
  action,
  targetType,
  targetId,
  payload,
  timestamp,
  variant,
}: AuditRowProps) {
  const [open, setOpen] = useState(false)
  const hasPayload = payload && Object.keys(payload).length > 0

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-1)',
      }}
    >
      <button
        type="button"
        onClick={() => hasPayload && setOpen(!open)}
        style={{
          width: '100%',
          padding: '10px 22px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) auto minmax(0, 2fr) auto',
          alignItems: 'center',
          gap: '12px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: hasPayload ? 'pointer' : 'default',
          transition: 'background .15s var(--ease)',
        }}
        className={hasPayload ? 'nx-audit-row' : undefined}
        aria-expanded={hasPayload ? open : undefined}
      >
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 500,
              color: 'var(--text-1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {actorName}
          </span>
          {actorRole && (
            <span
              className="mono"
              style={{
                fontSize: '9.5px',
                color: 'var(--text-4)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {actorRole}
            </span>
          )}
        </div>

        <Badge variant={variant} size="sm">
          {action}
        </Badge>

        <div
          style={{
            fontSize: '11.5px',
            color: 'var(--text-3)',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {targetType}
          {targetId && (
            <span className="mono" style={{ color: 'var(--text-4)', marginLeft: '6px' }}>
              {targetId.slice(0, 8)}
            </span>
          )}
          {hasPayload && (
            <span style={{ marginLeft: '8px', color: 'var(--text-4)' }} aria-hidden>
              {open ? '▼' : '▶'}
            </span>
          )}
        </div>

        <div
          className="mono"
          style={{
            fontSize: '10.5px',
            color: 'var(--text-4)',
            letterSpacing: '0.02em',
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {formatTimestamp(timestamp)}
        </div>
      </button>

      {hasPayload && open && (
        <pre
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-3)',
            background: 'var(--bg-elev-2)',
            borderTop: '1px solid var(--border-1)',
            padding: '12px 22px',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}

      <style>{`
        .nx-audit-row:hover {
          background: var(--bg-elev-1);
        }
      `}</style>
    </div>
  )
}
