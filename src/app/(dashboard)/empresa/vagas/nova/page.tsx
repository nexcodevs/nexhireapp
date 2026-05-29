import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import JobFromBriefFlow from '@/components/jobs/JobFromBriefFlow'
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
      <PageHeader
        eyebrow="Nova vaga"
        title="Vamos abrir uma"
        titleAccent="vaga"
        subtitle="Descreve em texto livre o que você precisa contratar. A IA monta a vaga, você revisa e publica."
      />

      <JobFromBriefFlow companyId={companyId} userId={user.id} />
    </div>
  )
}
