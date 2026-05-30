import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // Admin client bypassa RLS — leituras críticas de signup/onboarding
  // não podem depender de policies do client.
  const admin = createAdminClient()

  const { data: userData } = await admin
    .from('users')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (!['company_user', 'admin'].includes(userData?.role || '')) {
    redirect('/login')
  }

  // Se já tem company linkada, vai direto pro dashboard
  const { data: existing } = await admin
    .from('company_users')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

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
