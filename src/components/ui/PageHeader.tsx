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
    <div className="nx-page-header">
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="nx-page-header__eyebrow">{eyebrow}</div>}
        <h1 className="nx-page-header__title">
          {title}
          {titleAccent && (
            <>
              {' '}
              <span className="nx-page-header__accent">{titleAccent}</span>
            </>
          )}
        </h1>
        {subtitle && <p className="nx-page-header__sub">{subtitle}</p>}
      </div>
      {action && <div className="nx-page-header__actions">{action}</div>}
    </div>
  )
}
