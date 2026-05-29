import KanbanCard, { type KanbanCardData } from './KanbanCard'

export type ColumnAccent = 'yellow' | 'mint' | 'blue' | 'green' | 'dark' | 'subtle'

const accentDotColor: Record<ColumnAccent, string> = {
  yellow: 'var(--amber-500)',
  mint: 'var(--neon)',
  blue: 'var(--cyan-400)',
  green: 'var(--green-600)',
  dark: 'var(--text-1)',
  subtle: 'var(--text-4)',
}

interface KanbanColumnProps {
  title: string
  accent: ColumnAccent
  cards: KanbanCardData[]
  emptyLine: string
  showJob?: boolean
}

export default function KanbanColumn({
  title,
  accent,
  cards,
  emptyLine,
  showJob,
}: KanbanColumnProps) {
  return (
    <section
      aria-label={title}
      style={{
        flex: '0 0 280px',
        background: 'var(--bg-elev-2)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-lg)',
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: 0,
        maxHeight: 'calc(100vh - 200px)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '0 4px 8px',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            aria-hidden="true"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: accentDotColor[accent],
              flexShrink: 0,
            }}
          />
          <h2
            className="mono"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </h2>
        </div>
        <span
          className="mono"
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: 'var(--text-4)',
            background: 'var(--bg-elev-1)',
            border: '1px solid var(--border-1)',
            padding: '2px 7px',
            borderRadius: 'var(--r-full)',
            flexShrink: 0,
          }}
        >
          {cards.length}
        </span>
      </header>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          flex: 1,
          padding: '2px',
        }}
      >
        {cards.length === 0 ? (
          <div
            style={{
              padding: '20px 10px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--text-4)',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.5,
            }}
          >
            {emptyLine}
          </div>
        ) : (
          cards.map(card => <KanbanCard key={card.id} card={card} showJob={showJob} />)
        )}
      </div>
    </section>
  )
}
