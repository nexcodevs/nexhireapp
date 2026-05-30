import Link from 'next/link'

export interface AttentionItem {
  /** Texto principal (negrito). */
  title: string
  /** Texto secundário menor. */
  context?: string
  /** Quantidade pra destacar à esquerda (ex: 5). */
  count?: number
  /** Tom: positivo, alerta, neutro. */
  tone?: 'attention' | 'positive' | 'neutral'
  /** Link de ação. */
  href?: string
  /** Label da ação (default = "Ver →"). */
  cta?: string
}

interface AttentionListProps {
  title: string
  items: AttentionItem[]
  emptyMessage?: string
}

/**
 * Lista de alertas/ações pra mostrar em dashboards.
 * Responde "o que exige atenção?" do PRODUCT_VISION.
 *
 * Cada item tem: contagem opcional (visual destaque) + título + contexto + CTA.
 * Tom muda cor lateral (atenção amarelo, positivo verde).
 */
export default function AttentionList({
  title,
  items,
  emptyMessage = 'Tudo em dia.',
}: AttentionListProps) {
  return (
    <div
      style={{
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-md)',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: items.length > 0 ? '1px solid var(--border-1)' : 'none',
          fontSize: '12.5px',
          fontWeight: 600,
          color: 'var(--text-1)',
          letterSpacing: '-0.005em',
        }}
      >
        {title}
      </div>
      {items.length === 0 ? (
        <p
          style={{
            padding: '18px',
            fontSize: '12px',
            color: 'var(--text-4)',
            textAlign: 'center',
          }}
        >
          {emptyMessage}
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-(--border-1)">
          {items.map((item, i) => {
            const toneColor =
              item.tone === 'attention'
                ? 'var(--warning-text)'
                : item.tone === 'positive'
                  ? 'var(--accent-text)'
                  : 'var(--text-3)'

            const content = (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 18px',
                  transition: 'background .15s var(--ease)',
                }}
                className={item.href ? 'nx-attention-row' : undefined}
              >
                {typeof item.count === 'number' && (
                  <div
                    style={{
                      flexShrink: 0,
                      minWidth: '28px',
                      fontSize: '18px',
                      fontWeight: 500,
                      color: toneColor,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {item.count}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-1)',
                      lineHeight: 1.35,
                    }}
                  >
                    {item.title}
                  </div>
                  {item.context && (
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-4)',
                        marginTop: '2px',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.context}
                    </div>
                  )}
                </div>
                {item.href && (
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      fontSize: '12px',
                      color: 'var(--accent-text)',
                      fontWeight: 500,
                    }}
                  >
                    {item.cta ?? 'Ver →'}
                  </span>
                )}
              </div>
            )

            return item.href ? (
              <Link
                key={i}
                href={item.href}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                {content}
              </Link>
            ) : (
              <div key={i}>{content}</div>
            )
          })}
        </div>
      )}
      <style>{`
        .nx-attention-row:hover {
          background: var(--bg-elev-2);
        }
      `}</style>
    </div>
  )
}
