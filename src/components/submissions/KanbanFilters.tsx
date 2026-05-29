import Link from 'next/link'

export interface KanbanFilterJob {
  id: string
  title: string
  companyName: string | null
  seniority: string | null
  count: number
}

interface KanbanFiltersProps {
  jobs: KanbanFilterJob[]
  selectedJobId: string | null
  totalCount: number
}

export default function KanbanFilters({
  jobs,
  selectedJobId,
  totalCount,
}: KanbanFiltersProps) {
  return (
    <nav
      aria-label="Filtrar pipeline por vaga"
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingBottom: '6px',
          scrollbarWidth: 'thin',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-subtle)',
            marginRight: '4px',
            flexShrink: 0,
          }}
        >
          Filtrar:
        </span>

        <FilterChip
          href="/hr/pipeline"
          active={!selectedJobId}
          label="Todas as vagas"
          count={totalCount}
        />

        {jobs.map(job => (
          <FilterChip
            key={job.id}
            href={`/hr/pipeline?vaga=${job.id}`}
            active={selectedJobId === job.id}
            label={job.title}
            subtitle={[job.seniority, job.companyName].filter(Boolean).join(' · ') || undefined}
            count={job.count}
          />
        ))}
      </div>
    </nav>
  )
}

interface FilterChipProps {
  href: string
  active: boolean
  label: string
  subtitle?: string
  count: number
}

function FilterChip({ href, active, label, subtitle, count }: FilterChipProps) {
  return (
    <Link
      href={href}
      className="kanban-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 14px',
        borderRadius: '999px',
        textDecoration: 'none',
        background: active ? 'var(--color-f900)' : 'var(--color-surf)',
        color: active ? 'var(--color-neon)' : 'var(--color-text2)',
        border: `1px solid ${active ? 'var(--color-f900)' : 'var(--color-border)'}`,
        fontSize: '12.5px',
        fontWeight: active ? 600 : 500,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'all 0.15s',
      }}
      aria-current={active ? 'page' : undefined}
      title={subtitle}
    >
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
        <span>{label}</span>
        {subtitle && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 400,
              color: active ? 'rgba(0,230,118,0.6)' : 'var(--color-subtle)',
              marginTop: '1px',
            }}
          >
            {subtitle}
          </span>
        )}
      </span>
      <span
        className="mono"
        style={{
          fontSize: '11px',
          fontWeight: 500,
          color: active ? 'var(--color-neon)' : 'var(--color-subtle)',
          background: active ? 'rgba(0,230,118,0.12)' : 'var(--color-cream)',
          padding: '1px 7px',
          borderRadius: '999px',
        }}
      >
        {count}
      </span>
    </Link>
  )
}
