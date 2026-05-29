-- ============================================================================
-- Endurecimento de RLS em `candidates` — pré-deploy
-- Data: 2026-05-29
--
-- Garante que RLS esteja habilitada e cria policies completas por papel.
-- Idempotente: pode ser rodada várias vezes sem efeito colateral.
-- ============================================================================

-- 1. Habilita RLS (caso ainda esteja desabilitada por troubleshooting passado)
alter table public.candidates enable row level security;

-- 2. Limpa policies antigas com nomes que podem ter conflito
drop policy if exists "Recruiters insert candidates" on public.candidates;
drop policy if exists "Recruiters update own candidates" on public.candidates;
drop policy if exists "Recruiters read own candidates" on public.candidates;
drop policy if exists "HR and admin read all candidates" on public.candidates;
drop policy if exists "Companies read candidates of own jobs" on public.candidates;

-- 3. INSERT — hunter aprovado pode criar candidato
create policy "Recruiters insert candidates"
on public.candidates
for insert
to authenticated
with check (
  exists (
    select 1 from public.recruiters r
    where r.user_id = auth.uid() and r.status = 'approved'
  )
);

-- 4. UPDATE — hunter pode atualizar candidato que ele já enviou
create policy "Recruiters update own candidates"
on public.candidates
for update
to authenticated
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

-- 5. SELECT — hunter lê os candidatos que enviou
create policy "Recruiters read own candidates"
on public.candidates
for select
to authenticated
using (
  exists (
    select 1
    from public.submissions s
    join public.recruiters r on r.id = s.recruiter_id
    where s.candidate_id = candidates.id and r.user_id = auth.uid()
  )
);

-- 6. SELECT — HR e admin leem todos
create policy "HR and admin read all candidates"
on public.candidates
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
  )
);

-- 7. SELECT — empresa lê candidatos enviados pras vagas dela
--     (somente quando o status da submissão é visível pra empresa)
create policy "Companies read candidates of own jobs"
on public.candidates
for select
to authenticated
using (
  exists (
    select 1
    from public.submissions s
    join public.jobs j on j.id = s.job_id
    join public.company_users cu on cu.company_id = j.company_id
    where s.candidate_id = candidates.id
      and cu.user_id = auth.uid()
      and s.status in (
        'sent_to_client',
        'client_approved',
        'client_rejected',
        'interview_scheduled',
        'offer',
        'hired',
        'not_hired'
      )
  )
);

-- 8. Nenhum DELETE policy — só service_role apaga (admin client backend)
