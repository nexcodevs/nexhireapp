import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = userData?.role || 'candidate'
  const redirectMap: Record<string, string> = {
    admin: '/hr',
    hr_manager: '/hr',
    company_user: '/empresa',
    recruiter: '/hunter',
    candidate: '/candidato',
  }

  redirect(redirectMap[role] || '/candidato')
}