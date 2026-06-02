import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const admin = createAdminClient()
  const { data: userData } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (userData?.role !== 'admin') {
    redirect('/login')
  }

  return <>{children}</>
}
