-- ============================================================================
-- Onda 1.A — Candidato gerencia próprio perfil (FK + RLS + Storage)
-- Data: 2026-06-10
--
-- Hoje candidates só é criado por hunter. Pra candidato logado editar seu
-- próprio perfil (Onda 1), adicionamos FK user_id + RLS policies de
-- self-service + policy de Storage pra upload na própria pasta.
--
-- Registros existentes (criados por hunter) ficam com user_id = NULL —
-- continuam funcionando via policies de hunter/HR/empresa que já existem.
-- ============================================================================

-- 1. FK candidates.user_id (NULL pra históricos)
alter table public.candidates
  add column if not exists user_id uuid references public.users(id) on delete set null;

create index if not exists idx_candidates_user_id
  on public.candidates(user_id)
  where user_id is not null;

-- Garante 1 perfil por user (candidato não pode ter 2 rows simultâneas)
create unique index if not exists uniq_candidates_user_id
  on public.candidates(user_id)
  where user_id is not null;

comment on column public.candidates.user_id is
  'Vincula candidato a user logado (NULL pra históricos criados por hunter sem login do candidato).';

-- 2. RLS: candidato gerencia o próprio perfil
drop policy if exists "Candidate reads own profile" on public.candidates;
create policy "Candidate reads own profile" on public.candidates
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Candidate inserts own profile" on public.candidates;
create policy "Candidate inserts own profile" on public.candidates
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'candidate'
    )
  );

drop policy if exists "Candidate updates own profile" on public.candidates;
create policy "Candidate updates own profile" on public.candidates
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. Storage: candidato faz upload na própria pasta {user_id}/...
drop policy if exists "Candidates upload own CVs" on storage.objects;
create policy "Candidates upload own CVs"
on storage.objects for insert
with check (
  bucket_id = 'cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'candidate'
  )
);

-- (read na própria pasta já é coberto pela policy "Recruiters read own CVs"
-- que valida só por auth.uid() = primeira parte do path, sem checar role)
