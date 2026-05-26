import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      <aside className="w-64 bg-[#052E16] flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-[#064E1F]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-bold text-lg tracking-tight">nexhire</span>
              <div className="mt-1">
                <span className="text-xs text-[#00E676] font-medium uppercase tracking-wider">
                  {roleLabels[user.role]}
                </span>
              </div>
            </div>
            <NotificationBell userId={user.id} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#A7F3D0] text-sm font-medium hover:bg-[#064E1F] hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#064E1F]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {user.full_name || 'Usuário'}
              </div>
              <div className="text-[#6B7280] text-xs truncate">
                {user.email}
              </div>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left text-xs text-[#6B7280] hover:text-white transition-colors py-1"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}