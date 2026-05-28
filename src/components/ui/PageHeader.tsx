interface PageHeaderProps {
  eyebrow?: string
  title: string
  titleAccent?: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div
            className="inline-flex items-center gap-1.5 mb-2.5"
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-g600)',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--color-neon)',
              }}
            />
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            color: 'var(--color-text)',
            marginBottom: '6px',
          }}
        >
          {title}
          {titleAccent && (
            <>
              {' '}
              <span className="it" style={{ color: 'var(--color-g600)' }}>
                {titleAccent}
              </span>
            </>
          )}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--color-muted)',
              fontWeight: 300,
              letterSpacing: '-0.005em',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}