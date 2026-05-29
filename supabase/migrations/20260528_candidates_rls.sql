-- ============================================================================
-- Policies de RLS faltando em `candidates`
-- Data: 2026-05-28
--
-- Sintoma: `new row violates row-level security policy for table "candidates"`
-- quando hunter aprovado tenta enviar candidato novo.
--
-- Causa: a RLS foi reativada na tabela mas só as policies de SELECT existem.
-- Faltam INSERT (hunter cria) e UPDATE (hunter completa cv_url).
-- ============================================================================

-- Limpa policies de mesmo nome se já existirem (idempotente)
drop policy if exists "Recruiters insert candidates" on public.candidates;
drop policy if exists "Recruiters update own candidates" on public.candidates;

-- Hunter aprovado pode criar candidato
create policy "Recruiters insert candidates"
on public.candidates
for insert
with check (
  exists (
    select 1 from public.recruiters r
    where r.user_id = auth.uid() and r.status = 'approved'
  )
);

-- Hunter pode atualizar candidato que ele mesmo já enviou
-- (necessário pra preencher cv_url quando o candidato existe sem CV)
create policy "Recruiters update own candidates"
on public.candidates
for update
using (
  exists (
    select 1
    from public.submissions s
    join public.recruiters r on r.id = s.recruiter_id
    where s.candidate_id = candidates.id and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.submissions s
    join public.recruiters r on r.id = s.recruiter_id
    where s.candidate_id = candidates.id and r.user_id = auth.uid()
  )
);
