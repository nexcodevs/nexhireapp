import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Layout do portal master da Nexhire. Só `admin` (platform admin) acessa.
 * Outros roles caem no /login.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/login')
  }

  return <>{children}</>
}
