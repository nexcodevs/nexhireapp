import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import CompaniesList, { type CompanyListItem } from './CompaniesList'

export const metadata = {
  title: 'Empresas — Admin Nexhire',
}

interface CompanyRow {
  id: string
  name: string
  website: string | null
  industry: string | null
  size: string | null
  created_at: string
}

export default async function AdminEmpresasPage() {
  const supabase = createAdminClient()

  const { data: companiesRaw } = await supabase
    .from('companies')
    .select('id, name, website, industry, size, created_at')
    .order('created_at', { ascending: false })

  const companies = (companiesRaw ?? []) as CompanyRow[]
  const companyIds = companies.map(c => c.id)

  const { data: jobsAgg } = companyIds.length
    ? await supabase
        .from('jobs')
        .select('company_id, status')
        .in('company_id', companyIds)
    : { data: [] as { company_id: string; status: string }[] }

  const { data: hiredSubs } = companyIds.length
    ? await supabase
        .from('submissions')
        .select('jobs!inner(company_id)')
        .eq('status', 'hired')
        .in('jobs.company_id', companyIds)
    : { data: [] as Array<{ jobs: { company_id: string } | { company_id: string }[] | null }> }

  const aggByCompany = new Map<string, { total: number; open: number; hires: number }>()
  for (const c of companies) {
    aggByCompany.set(c.id, { total: 0, open: 0, hires: 0 })
  }
  for (const j of jobsAgg ?? []) {
    const agg = aggByCompany.get(j.company_id)
    if (!agg) continue
    agg.total += 1
    if (j.status === 'open_for_hunters') agg.open += 1
  }
  for (const h of hiredSubs ?? []) {
    const jobsRel = h.jobs as { company_id: string } | { company_id: string }[] | null
    const cid = Array.isArray(jobsRel) ? jobsRel[0]?.company_id : jobsRel?.company_id
    if (!cid) continue
    const agg = aggByCompany.get(cid)
    if (agg) agg.hires += 1
  }

  const items: CompanyListItem[] = companies.map(c => {
    const agg = aggByCompany.get(c.id) ?? { total: 0, open: 0, hires: 0 }
    return {
      ...c,
      totalJobs: agg.total,
      openJobs: agg.open,
      hires: agg.hires,
    }
  })

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Admin Nexhire"
        title="Empresas"
        titleAccent="cadastradas"
        subtitle={`${companies.length} empresa${companies.length !== 1 ? 's' : ''} na plataforma. Click numa linha pra ver as vagas.`}
      />
      <CompaniesList companies={items} />
    </div>
  )
}
