-- Bloqueio empresa → hunter: empresa pode impedir que hunters específicos
-- vejam suas vagas. Útil pra conflitos de interesse e qualidade.

create table if not exists public.company_blocked_hunters (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recruiter_id uuid not null references public.recruiters(id) on delete cascade,
  reason text,
  blocked_by uuid not null references public.users(id),
  created_at timestamp with time zone default now(),
  unique (company_id, recruiter_id)
);

create index if not exists idx_cbh_company on public.company_blocked_hunters(company_id);
create index if not exists idx_cbh_recruiter on public.company_blocked_hunters(recruiter_id);

alter table public.company_blocked_hunters enable row level security;

-- Empresa pode CRUD nos seus próprios bloqueios
create policy "Company users manage own blocks"
  on public.company_blocked_hunters
  for all
  to authenticated
  using (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  )
  with check (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  );

-- HR Manager e admin podem ver tudo (sem editar)
create policy "HR and admin can read all blocks"
  on public.company_blocked_hunters
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('hr_manager', 'admin')
    )
  );

-- Hunter NÃO precisa de policy de SELECT — não deve ver bloqueios diretamente.
-- A query do hunter usa o service_role indireto via SQL helper (ver função
-- `get_blocked_company_ids_for_recruiter`).

create or replace function public.get_blocked_company_ids_for_user(user_uuid uuid)
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select cbh.company_id
  from public.company_blocked_hunters cbh
  join public.recruiters r on r.id = cbh.recruiter_id
  where r.user_id = user_uuid;
$$;

grant execute on function public.get_blocked_company_ids_for_user(uuid) to authenticated;

comment on table public.company_blocked_hunters is
  'Bloqueio explícito: empresa não quer esse hunter vendo suas vagas.';
