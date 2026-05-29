import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildDedupSignals } from '@/lib/dedup'

interface CandidateMatch {
  candidate_id: string
  full_name: string | null
  email: string | null
  matched_on: ('email' | 'phone' | 'linkedin')[]
}

interface SubmissionInfo {
  id: string
  job_id: string
  recruiter_id: string
  status: string
  submitted_at: string
  ownership_expires_at: string | null
}

interface CandidateRow {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
}

interface RecruiterRow {
  id: string
  users: { full_name: string | null } | { full_name: string | null }[] | null
}

interface JobRow {
  id: string
  title: string
}

function pickOne<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

/**
 * Checa se um candidato em rascunho já existe na base.
 * Retorna matches por email exato, telefone normalizado, e LinkedIn normalizado.
 * Pra cada match traz a submissão mais recente (quem é dono, status, ownership).
 *
 * Não escreve nada — o hunter decide se procede ou aborta.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = (await request.json()) as {
      email?: string
      phone?: string
      linkedin_url?: string
      job_id?: string
    }

    const signals = buildDedupSignals(body)

    if (!signals.email && !signals.phone && !signals.linkedinUsername) {
      return NextResponse.json({ matches: [] })
    }

    // Service role pra ver registros de outros hunters
    const admin = createAdminClient()

    // Busca candidatos potencialmente duplicados.
    // OR composto via .or() do Supabase.
    const orConditions: string[] = []
    if (signals.email) orConditions.push(`email.eq.${signals.email}`)
    if (signals.phone) orConditions.push(`phone.ilike.%${signals.phone}`)
    if (signals.linkedinUsername) {
      orConditions.push(`linkedin_url.ilike.%/in/${signals.linkedinUsername}%`)
    }

    const { data: candidates } = await admin
      .from('candidates')
      .select('id, full_name, email, phone, linkedin_url')
      .or(orConditions.join(','))
      .limit(10)
      .returns<CandidateRow[]>()

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // Filtra match real (a query .or pode trazer falso positivo de phone ilike)
    const matches: CandidateMatch[] = candidates
      .map(c => {
        const candidateSignals = buildDedupSignals({
          email: c.email,
          phone: c.phone,
          linkedin_url: c.linkedin_url,
        })
        const matchedOn: CandidateMatch['matched_on'] = []
        if (signals.email && candidateSignals.email === signals.email) {
          matchedOn.push('email')
        }
        if (signals.phone && candidateSignals.phone === signals.phone) {
          matchedOn.push('phone')
        }
        if (
          signals.linkedinUsername &&
          candidateSignals.linkedinUsername === signals.linkedinUsername
        ) {
          matchedOn.push('linkedin')
        }
        return matchedOn.length > 0
          ? {
              candidate_id: c.id,
              full_name: c.full_name,
              email: c.email,
              matched_on: matchedOn,
            }
          : null
      })
      .filter((m): m is CandidateMatch => m !== null)

    if (matches.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    const candidateIds = matches.map(m => m.candidate_id)

    // Última submissão de cada candidato — pra ownership e contexto
    const { data: subs } = await admin
      .from('submissions')
      .select('id, job_id, candidate_id, recruiter_id, status, submitted_at, ownership_expires_at')
      .in('candidate_id', candidateIds)
      .order('submitted_at', { ascending: false })

    const subsByCandidate = new Map<string, SubmissionInfo>()
    for (const s of subs ?? []) {
      if (!subsByCandidate.has(s.candidate_id)) {
        subsByCandidate.set(s.candidate_id, {
          id: s.id,
          job_id: s.job_id,
          recruiter_id: s.recruiter_id,
          status: s.status,
          submitted_at: s.submitted_at,
          ownership_expires_at: s.ownership_expires_at,
        })
      }
    }

    const recruiterIds = [...new Set([...subsByCandidate.values()].map(s => s.recruiter_id))]
    const jobIds = [...new Set([...subsByCandidate.values()].map(s => s.job_id))]

    const [recRes, jobRes] = await Promise.all([
      recruiterIds.length > 0
        ? admin
            .from('recruiters')
            .select('id, users(full_name)')
            .in('id', recruiterIds)
            .returns<RecruiterRow[]>()
        : Promise.resolve({ data: [] as RecruiterRow[] }),
      jobIds.length > 0
        ? admin
            .from('jobs')
            .select('id, title')
            .in('id', jobIds)
            .returns<JobRow[]>()
        : Promise.resolve({ data: [] as JobRow[] }),
    ])

    const recNames = new Map<string, string>()
    for (const r of recRes.data ?? []) {
      const u = pickOne(r.users)
      recNames.set(r.id, u?.full_name ?? 'Outro hunter')
    }
    const jobTitles = new Map<string, string>()
    for (const j of jobRes.data ?? []) {
      jobTitles.set(j.id, j.title)
    }

    const enriched = matches.map(m => {
      const sub = subsByCandidate.get(m.candidate_id) ?? null
      const ownershipActive = !!(
        sub?.ownership_expires_at && new Date(sub.ownership_expires_at) > new Date()
      )
      const sameJob = body.job_id && sub?.job_id === body.job_id
      return {
        ...m,
        latest_submission: sub
          ? {
              job_id: sub.job_id,
              job_title: jobTitles.get(sub.job_id) ?? null,
              recruiter_name: recNames.get(sub.recruiter_id) ?? null,
              status: sub.status,
              submitted_at: sub.submitted_at,
              ownership_active: ownershipActive,
              ownership_expires_at: sub.ownership_expires_at,
              same_job: !!sameJob,
            }
          : null,
      }
    })

    return NextResponse.json({ matches: enriched })
  } catch (error) {
    console.error('[check-duplicate]', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
