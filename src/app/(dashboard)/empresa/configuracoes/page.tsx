import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import CompanyEditForm from '@/components/empresa/CompanyEditForm'
import { requireCompany } from '@/lib/company'

export const metadata = {
  title: 'Configurações da empresa — Nexhire',
}

export default async function EmpresaConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const companyId = await requireCompany(supabase, user.id)

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, website, industry, size, logo_url')
    .eq('id', companyId)
    .single()

  if (!company) redirect('/empresa/onboarding')

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Empresa"
        title="Configurações"
        titleAccent=""
        subtitle="Dados que aparecem pra hunters e nos detalhes da vaga."
      />
      <CompanyEditForm
        companyId={company.id}
        initial={{
          name: company.name ?? '',
          website: company.website ?? '',
          industry: company.industry ?? '',
          size: company.size ?? '',
          logo_url: company.logo_url ?? null,
        }}
      />
    </div>
  )
}
