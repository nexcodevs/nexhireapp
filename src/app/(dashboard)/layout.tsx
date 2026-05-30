import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User } from '@/types/database'
import DashboardShell, { type NavItemDef } from '@/components/dashboard/DashboardShell'

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

const navItems: Record<string, NavItemDef[]> = {
  // Ordem: gestão/operação no topo, sistema (config, etc) embaixo
  company_user: [
    { href: '/empresa', label: 'Dashboard', icon: 'home' },
    { href: '/empresa/vagas', label: 'Vagas', icon: 'briefcase' },
    { href: '/empresa/candidatos', label: 'Candidatos', icon: 'users' },
    { href: '/empresa/configuracoes', label: 'Configurações', icon: 'columns' },
  ],
  recruiter: [
    { href: '/hunter', label: 'Dashboard', icon: 'home' },
    { href: '/hunter/vagas', label: 'Vagas disponíveis', icon: 'search' },
    { href: '/hunter/submissoes', label: 'Minhas submissões', icon: 'send' },
  ],
  hr_manager: [
    { href: '/hr', label: 'Dashboard', icon: 'home' },
    { href: '/hr/vagas', label: 'Vagas', icon: 'briefcase' },
    { href: '/hr/submissoes', label: 'Submissões', icon: 'inbox' },
    { href: '/hr/pipeline', label: 'Pipeline', icon: 'columns' },
    { href: '/hr/hunters', label: 'Hunters', icon: 'users' },
  ],
  admin: [
    { href: '/admin', label: 'Plataforma', icon: 'home' },
    { href: '/admin/empresas', label: 'Empresas', icon: 'building' },
    { href: '/admin/hunters', label: 'Hunters', icon: 'users' },
    { href: '/admin/ai-usage', label: 'Consumo IA', icon: 'columns' },
    { href: '/admin/audit', label: 'Audit log', icon: 'inbox' },
  ],
  candidate: [
    { href: '/candidato', label: 'Dashboard', icon: 'home' },
    { href: '/candidato/vagas', label: 'Ver vagas', icon: 'search' },
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

  const items = navItems[user.role] || navItems.candidate

  return (
    <DashboardShell
      userId={user.id}
      userName={user.full_name}
      userEmail={user.email}
      userRole={user.role}
      roleLabel={roleLabels[user.role] || ''}
      items={items}
    >
      {children}
    </DashboardShell>
  )
}
