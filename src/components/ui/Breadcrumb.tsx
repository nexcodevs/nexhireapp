import Link from 'next/link'

interface Crumb {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: Crumb[]
  className?: string
}

/**
 * Trilha de navegação pra telas profundas (ex: vaga → candidatos → detalhe).
 * Último item sempre é a página atual (sem link).
 *
 * Uso:
 * <Breadcrumb items={[
 *   { label: 'Vagas', href: '/empresa/vagas' },
 *   { label: 'Engenheiro Sênior', href: '/empresa/vagas/123' },
 *   { label: 'Pedro Henrique' },
 * ]} />
 */
export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length === 0) return null
  return (
    <nav
      aria-label="Navegação estrutural"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '20px',
        fontSize: '12.5px',
        color: 'var(--text-4)',
      }}
    >
      {items.map((crumb, i) => {
        const isLast = i === items.length - 1
        return (
          <span
            key={`${i}-${crumb.label}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {!isLast && crumb.href ? (
              <Link
                href={crumb.href}
                style={{
                  color: 'var(--text-3)',
                  textDecoration: 'none',
                  transition: 'color .15s var(--ease)',
                }}
                className="nx-breadcrumb-link"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                style={{
                  color: isLast ? 'var(--text-2)' : 'var(--text-3)',
                  fontWeight: isLast ? 500 : 400,
                }}
              >
                {crumb.label}
              </span>
            )}
            {!isLast && (
              <span
                aria-hidden
                style={{ color: 'var(--text-4)', fontSize: '11px' }}
              >
                /
              </span>
            )}
          </span>
        )
      })}
      <style>{`
        .nx-breadcrumb-link:hover {
          color: var(--text-1);
          text-decoration: underline;
        }
      `}</style>
    </nav>
  )
}
