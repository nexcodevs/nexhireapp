import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobForm from '@/components/jobs/JobForm'

export const metadata = {
  title: 'Nova vaga — Nexhire',
}

export default async function NovaVagaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Buscar ou criar empresa do usuário
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  let companyId = companyUser?.company_id

  // Se não tem empresa, criar uma automaticamente
  if (!companyId) {
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const { data: newCompany } = await supabase
      .from('companies')
      .insert({ name: userData?.full_name || userData?.email || 'Minha Empresa' })
      .select()
      .single()

    if (newCompany) {
      await supabase
        .from('company_users')
        .insert({ company_id: newCompany.id, user_id: user.id, role: 'owner' })

      companyId = newCompany.id
    }
  }

  if (!companyId) redirect('/empresa')

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-1">
          Abrir nova vaga
        </h1>
        <p className="text-muted text-sm">
          Preencha os dados da vaga. Após enviar, o HR Manager vai revisar e liberar para os hunters.
        </p>
      </div>

      <JobForm companyId={companyId} userId={user.id} />
    </div>
  )
}
