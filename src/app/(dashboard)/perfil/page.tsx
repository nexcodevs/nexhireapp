import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ProfileForm from '@/components/profile/ProfileForm'
import PasswordForm from '@/components/profile/PasswordForm'
import PreferencesForm from '@/components/profile/PreferencesForm'

export const metadata = {
  title: 'Meu perfil — Nexhire',
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: userData } = await admin
    .from('users')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!userData) redirect('/login')

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <PageHeader
        eyebrow="Conta"
        title="Meu"
        titleAccent="perfil"
        subtitle="Dados que aparecem pra outros usuários e segurança da conta."
      />

      <ProfileForm
        initial={{
          full_name: userData.full_name ?? '',
          email: userData.email,
        }}
      />

      <PreferencesForm />

      <PasswordForm />
    </div>
  )
}
