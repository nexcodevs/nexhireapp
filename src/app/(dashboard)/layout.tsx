import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User } from '@/types/database'
import NotificationBell from '@/components/ui/NotificationBell'

async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

const navItems = {
  company_user: [
    { href: '/empresa', label: 'Dashboard' },
    { href: '/empresa/vagas', label: 'Minhas vagas' },
    { href: '/empresa/candidatos', label: 'Candidatos' },
  ],
  recruiter: [
    { href: '/hunter', label: 'Dashboard' },
    { href: '/hunter/vagas', label: 'Vagas disponíveis' },
    { href: '/hunter/submissoes', label: 'Minhas submissões' },
  ],
  hr_manager: [
    { href: '/hr', label: 'Dashboard' },
    { href: '/hr/vagas', label: 'Vagas' },
    { href: '/hr/submissoes', label: 'Submissões' },
    { href: '/hr/hunters', label: 'Hunters' },
    { href: '/hr/clientes', label: 'Clientes' },
  ],
  admin: [
    { href: '/hr', label: 'Dashboard' },
    { href: '/hr/vagas', label: 'Vagas' },
    { href: '/hr/hunters', label: 'Hunters' },
  ],
  candidate: [
    { href: '/candidato', label: 'Dashboard' },
    { href: '/candidato/vagas', label: 'Ver vagas' },
  ],
}

const roleLabels: Record<string, string> = {
  company_user: 'Empresa',
  recruiter: 'Hunter',
  hr_manager: 'HR Manager',
  admin: 'Admin',
  candidate: 'Candidato',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const items = navItems[user.role as keyof typeof navItems] || navItems.candidate
  const initials =
    user.full_name
      ?.split(' ')
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || user.email.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-app)' }}>
      <aside
        className="w-60 flex flex-col fixed h-full"
        style={{
          background: 'var(--color-f900)',
          borderRight: '1px solid var(--color-f800)',
        }}
      >
        {/* Brand */}
        <div
          className="px-5 pt-6 pb-5 flex items-start justify-between gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}
        >
          <Link href={items[0]?.href || '/'} className="block flex-1 min-w-0">
            <Image
              src="/brand/nexhire-logo.svg"
              alt="Nexhire"
              width={872}
              height={180}
              priority
              style={{
                width: '120px',
                height: 'auto',
                display: 'block',
              }}
            />
            <span
              className="mt-2 inline-block font-medium uppercase mono"
              style={{
                fontSize: '9.5px',
                letterSpacing: '0.18em',
                color: 'var(--color-neon)',
              }}
            >
              {roleLabels[user.role]}
            </span>
          </Link>
          <NotificationBell userId={user.id} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="sb-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                color: 'rgba(255,255,255,.65)',
                fontSize: '13.5px',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                textDecoration: 'none',
                transition: 'all .15s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div
          className="px-4 pt-4 pb-5"
          style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="rounded-full grid place-items-center flex-shrink-0"
              style={{
                width: '32px',
                height: '32px',
                background: 'var(--color-neon)',
                color: 'var(--color-f900)',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div
                className="text-white truncate"
                style={{ fontSize: '12.5px', fontWeight: 500 }}
              >
                {user.full_name || 'Usuário'}
              </div>
              <div
                className="truncate"
                style={{
                  fontSize: '10.5px',
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left transition-colors"
              style={{
                fontSize: '11.5px',
                color: 'rgba(255,255,255,.5)',
                padding: '4px 0',
              }}
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 ml-60" style={{ padding: '40px 48px' }}>
        {children}
      </main>

      <style>{`
        .sb-link:hover {
          background: rgba(255,255,255,.06);
          color: #ffffff;
        }
      `}</style>
    </div>
  )
}
