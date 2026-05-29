import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import OnboardingForm from './OnboardingForm'

export const metadata = {
  title: 'Configure sua empresa — Nexhire',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (!['company_user', 'admin'].includes(userData?.role || '')) {
    redirect('/login')
  }

  // Se já tem company linkada, vai direto pro dashboard
  const { data: existing } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (existing?.company_id) {
    redirect('/empresa')
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Configure sua empresa"
        title="Vamos te conhecer um"
        titleAccent="pouco"
        subtitle="Em 1 minuto a gente personaliza a Nexhire pro seu time. Você pode editar isso depois."
      />
      <OnboardingForm userId={user.id} userName={userData?.full_name ?? ''} />
    </div>
  )
}
