import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobForm from '@/components/jobs/JobForm'
import { requireCompany } from '@/lib/company'

export const metadata = {
  title: 'Nova vaga — Nexhire',
}

export default async function NovaVagaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const companyId = await requireCompany(supabase, user.id)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-1">Abrir nova vaga</h1>
        <p className="text-muted text-sm">
          Preencha os dados da vaga. Após enviar, o HR Manager vai revisar e liberar para os hunters.
        </p>
      </div>

      <JobForm companyId={companyId} userId={user.id} />
    </div>
  )
}
