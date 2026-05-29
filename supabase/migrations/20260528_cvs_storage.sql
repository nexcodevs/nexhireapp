-- ============================================================================
-- Bloco 1 — Storage para currículos (CVs)
-- Data: 2026-05-28
--
-- Cria bucket privado `cvs` e policies de RLS:
--  - Hunter aprovado faz upload em pasta com seu próprio user.id
--  - Hunter lê só os CVs que ele subiu
--  - HR Manager e Admin leem todos
--  - Empresa lê CVs de candidatos enviados pras vagas dela (via submissions)
--  - Ninguém deleta a não ser HR/Admin
-- ============================================================================

-- 1. Cria bucket privado
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- 2. Limpa policies antigas se já existirem (idempotente)
drop policy if exists "Recruiters upload own CVs" on storage.objects;
drop policy if exists "Recruiters read own CVs" on storage.objects;
drop policy if exists "HR read all CVs" on storage.objects;
drop policy if exists "HR delete CVs" on storage.objects;
drop policy if exists "Companies read CVs from own job submissions" on storage.objects;

-- 3. Hunter aprovado pode fazer upload na própria pasta (path: {user_id}/{uuid}.pdf)
create policy "Recruiters upload own CVs"
on storage.objects for insert
with check (
  bucket_id = 'cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
  and exists (
    select 1 from public.recruiters r
    where r.user_id = auth.uid() and r.status = 'approved'
  )
);

-- 4. Hunter lê só os CVs que ele subiu
create policy "Recruiters read own CVs"
on storage.objects for select
using (
  bucket_id = 'cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. HR Manager e Admin leem tudo
create policy "HR read all CVs"
on storage.objects for select
using (
  bucket_id = 'cvs'
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
  )
);

-- 6. Empresa lê CVs de candidatos enviados pras vagas dela
create policy "Companies read CVs from own job submissions"
on storage.objects for select
using (
  bucket_id = 'cvs'
  and exists (
    select 1
    from public.candidates c
    join public.submissions s on s.candidate_id = c.id
    join public.jobs j on j.id = s.job_id
    join public.company_users cu on cu.company_id = j.company_id
    where cu.user_id = auth.uid()
      and c.cv_url is not null
      and position(c.cv_url in name) > 0
  )
);

-- 7. Apenas HR/Admin podem deletar arquivos
create policy "HR delete CVs"
on storage.objects for delete
using (
  bucket_id = 'cvs'
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
  )
);
