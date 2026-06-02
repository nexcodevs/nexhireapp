import Link from 'next/link'
import NexhireLogo from '@/components/brand/NexhireLogo'

export default function PublicJobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-elev-1)',
        }}
      >
        <Link href="/vagas" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-1)' }}>
          <NexhireLogo width={108} />
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/login"
            style={{
              fontSize: '13px',
              color: 'var(--text-2)',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: 'var(--r-md)',
              fontWeight: 500,
            }}
            className="hover:underline"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            style={{
              fontSize: '13px',
              color: 'var(--text-on-dark)',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: 'var(--r-md)',
              fontWeight: 500,
              background: 'var(--text-1)',
            }}
          >
            Criar conta
          </Link>
        </nav>
      </header>

      <main style={{ flex: 1, padding: '32px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>{children}</div>
      </main>

      <footer
        style={{
          padding: '24px',
          borderTop: '1px solid var(--border-1)',
          fontSize: '12px',
          color: 'var(--text-4)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span>© {new Date().getFullYear()} Nexhire</span>
          <span style={{ display: 'flex', gap: '14px' }}>
            <Link href="/termos" style={{ color: 'var(--text-3)' }}>Termos</Link>
            <Link href="/privacidade" style={{ color: 'var(--text-3)' }}>Privacidade</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
