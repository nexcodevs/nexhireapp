-- ============================================================================
-- Branding da empresa: coluna logo_url + bucket público company_logos
-- Data: 2026-05-29
--
-- - Coluna logo_url em companies (path do storage)
-- - Bucket público (logos são vistas pelos hunters sem login custoso)
-- - Upload restrito a company_users da empresa (path = {company_id}/...)
-- ============================================================================

-- 1. Coluna
alter table public.companies
  add column if not exists logo_url text;

comment on column public.companies.logo_url is
  'Path no bucket company_logos. Ex: {company_id}/logo.png';

-- 2. Bucket público
insert into storage.buckets (id, name, public)
values ('company_logos', 'company_logos', true)
on conflict (id) do nothing;

-- 3. Policies
drop policy if exists "Public read company logos" on storage.objects;
drop policy if exists "Company users upload own logo" on storage.objects;
drop policy if exists "Company users update own logo" on storage.objects;
drop policy if exists "Company users delete own logo" on storage.objects;

-- Leitura pública (bucket é público)
create policy "Public read company logos"
on storage.objects for select
using (bucket_id = 'company_logos');

-- Upload só se user pertence à empresa (path = {company_id}/...)
create policy "Company users upload own logo"
on storage.objects for insert
with check (
  bucket_id = 'company_logos'
  and exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid()
      and cu.company_id::text = (storage.foldername(name))[1]
  )
);

create policy "Company users update own logo"
on storage.objects for update
using (
  bucket_id = 'company_logos'
  and exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid()
      and cu.company_id::text = (storage.foldername(name))[1]
  )
);

create policy "Company users delete own logo"
on storage.objects for delete
using (
  bucket_id = 'company_logos'
  and exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid()
      and cu.company_id::text = (storage.foldername(name))[1]
  )
);
