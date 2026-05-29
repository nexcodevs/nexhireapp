import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { formatDaysSince } from '@/lib/utils'

export interface KanbanCardData {
  id: string
  candidateName: string
  candidateTitle: string | null
  hunterName: string | null
  jobTitle: string | null
  aiScore: number | null
  submittedAt: string
}

interface KanbanCardProps {
  card: KanbanCardData
  showJob?: boolean
}

export default function KanbanCard({ card, showJob }: KanbanCardProps) {
  return (
    <Link
      href={`/hr/submissoes/${card.id}`}
      className="kanban-card"
      style={{
        display: 'block',
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-md)',
        padding: '12px 13px',
        textDecoration: 'none',
        transition: 'border-color .15s var(--ease), box-shadow .15s var(--ease), transform .15s var(--ease)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <Avatar name={card.candidateName} size="sm" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-1)',
              letterSpacing: '-0.005em',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.candidateName}
          </div>
          {card.candidateTitle && (
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--text-3)',
                fontWeight: 400,
                marginTop: '1px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {card.candidateTitle}
            </div>
          )}
        </div>
        {card.aiScore !== null && (
          <span
            className="it"
            style={{
              fontSize: '20px',
              color: 'var(--accent-text)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              flexShrink: 0,
              alignSelf: 'center',
            }}
            aria-label={`AI score ${card.aiScore}`}
          >
            {card.aiScore}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-1)',
          fontSize: '11px',
          color: 'var(--text-3)',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {showJob ? card.jobTitle || '—' : card.hunterName || '—'}
        </span>
        <span className="mono" style={{ flexShrink: 0, fontWeight: 500, fontSize: '10px', color: 'var(--text-4)' }}>
          {formatDaysSince(card.submittedAt)}
        </span>
      </div>
    </Link>
  )
}
