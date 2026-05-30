'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

export interface CompanyListItem {
  id: string
  name: string
  website: string | null
  industry: string | null
  size: string | null
  created_at: string
  totalJobs: number
  openJobs: number
  hires: number
}

interface CompaniesListProps {
  companies: CompanyListItem[]
}

export default function CompaniesList({ companies }: CompaniesListProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return companies.filter(c => {
      if (q) {
        const matchesName = c.name.toLowerCase().includes(q)
        const matchesIndustry = c.industry?.toLowerCase().includes(q) ?? false
        if (!matchesName && !matchesIndustry) return false
      }
      if (filterStatus === 'active' && c.openJobs === 0) return false
      if (filterStatus === 'inactive' && c.openJobs > 0) return false
      return true
    })
  }, [companies, search, filterStatus])

  return (
    <>
      <div
        className="flex items-center gap-3 flex-wrap mb-4"
        style={{
          padding: '10px 14px',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-md)',
        }}
      >
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou setor…"
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '7px 10px',
            fontSize: '13px',
            background: 'var(--bg-elev-2)',
            border: '1px solid var(--border-1)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text-1)',
            outline: 'none',
          }}
        />
        <div role="radiogroup" aria-label="Filtro por status" style={{ display: 'inline-flex', gap: '4px' }}>
          {(
            [
              { v: 'all', label: 'Todas' },
              { v: 'active', label: 'Com vagas ativas' },
              { v: 'inactive', label: 'Sem vagas' },
            ] as const
          ).map(opt => {
            const sel = filterStatus === opt.v
            return (
              <button
                key={opt.v}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => setFilterStatus(opt.v)}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: sel ? 600 : 500,
                  background: sel ? 'var(--accent-bg)' : 'transparent',
                  color: sel ? 'var(--accent-text)' : 'var(--text-3)',
                  border: `1px solid ${sel ? 'var(--accent-border)' : 'var(--border-1)'}`,
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        <span
          className="mono"
          style={{
            fontSize: '11px',
            color: 'var(--text-4)',
            letterSpacing: '0.04em',
            marginLeft: 'auto',
          }}
        >
          {filtered.length}/{companies.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p style={{ fontSize: '13px', color: 'var(--text-4)', padding: '14px 0' }}>
            Nenhuma empresa corresponde ao filtro.
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <div
            style={{
              padding: '10px 22px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) auto auto auto auto',
              gap: '16px',
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
            <span>Empresa</span>
            <span style={{ textAlign: 'right' }}>Vagas</span>
            <span style={{ textAlign: 'right' }}>Abertas</span>
            <span style={{ textAlign: 'right' }}>Hires</span>
            <span style={{ textAlign: 'right' }}>Cadastro</span>
          </div>

          <div className="flex flex-col divide-y divide-(--border-1)">
            {filtered.map(c => (
              <Link
                key={c.id}
                href={`/hr/vagas?company=${c.id}`}
                style={{
                  padding: '12px 22px',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 2fr) auto auto auto auto',
                  gap: '16px',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background .15s var(--ease)',
                }}
                className="nx-comp-row"
              >
                <div style={{ minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: 'var(--text-1)',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {c.name}
                    </span>
                    {c.industry && (
                      <Badge variant="purple" size="sm">
                        {c.industry}
                      </Badge>
                    )}
                    {c.size && (
                      <Badge variant="gray" size="sm">
                        {c.size}
                      </Badge>
                    )}
                  </div>
                  {c.website && (
                    <a
                      href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-3)',
                        textDecoration: 'underline',
                      }}
                    >
                      {c.website}
                    </a>
                  )}
                </div>
                <div className="mono" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', textAlign: 'right' }}>
                  {c.totalJobs}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: c.openJobs > 0 ? 'var(--accent-text)' : 'var(--text-4)',
                    textAlign: 'right',
                  }}
                >
                  {c.openJobs}
                </div>
                <div className="mono" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', textAlign: 'right' }}>
                  {c.hires}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--text-4)',
                    textAlign: 'right',
                  }}
                >
                  {formatDate(c.created_at)}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
      <style>{`
        .nx-comp-row:hover {
          background: var(--bg-elev-1);
        }
      `}</style>
    </>
  )
}
