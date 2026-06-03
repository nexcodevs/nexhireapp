import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import CandidateProfileForm from '@/components/profile/CandidateProfileForm'

export const metadata = {
  title: 'Meu perfil — Candidato — Nexhire',
}

interface CandidateRow {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  current_title: string | null
  location: string | null
  years_experience: number | null
  skills: unknown
  language_proficiency: unknown
  certifications: unknown
  cv_url: string | null
}

export default async function CandidatoPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: userData } = await admin
    .from('users')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  if (userData?.role !== 'candidate' && userData?.role !== 'admin') {
    redirect('/login')
  }

  const { data: candidate } = await admin
    .from('candidates')
    .select('id, full_name, email, phone, linkedin_url, current_title, location, years_experience, skills, language_proficiency, certifications, cv_url')
    .eq('user_id', user.id)
    .maybeSingle<CandidateRow>()

  const initial = {
    full_name: candidate?.full_name ?? userData?.full_name ?? '',
    email: candidate?.email ?? userData?.email ?? user.email ?? '',
    phone: candidate?.phone ?? '',
    linkedin_url: candidate?.linkedin_url ?? '',
    current_title: candidate?.current_title ?? '',
    location: candidate?.location ?? '',
    years_experience: candidate?.years_experience ?? null,
    skills: Array.isArray(candidate?.skills)
      ? (candidate.skills as unknown[]).filter((s): s is string => typeof s === 'string')
      : [],
    language_proficiency: Array.isArray(candidate?.language_proficiency)
      ? (candidate.language_proficiency as Array<{ language?: unknown; level?: unknown }>)
          .filter(l => typeof l?.language === 'string' && typeof l?.level === 'string')
          .map(l => ({ language: l.language as string, level: l.level as string }))
      : [],
    certifications: Array.isArray(candidate?.certifications)
      ? (candidate.certifications as unknown[]).filter((c): c is string => typeof c === 'string')
      : [],
    cv_url: candidate?.cv_url ?? null,
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <PageHeader
        eyebrow="Meu perfil"
        title="Seu"
        titleAccent="perfil de candidato"
        subtitle="Suba seu CV e a IA preenche os dados pra você revisar. Quanto mais completo, melhor o matching com as vagas."
      />

      <CandidateProfileForm initial={initial} />
    </div>
  )
}
