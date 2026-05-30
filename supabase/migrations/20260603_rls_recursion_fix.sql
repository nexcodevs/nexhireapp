-- ============================================================================
-- Fix RLS recursion (HOTFIX)
-- Data: 2026-06-03
--
-- Problema: policies que checam role do user via `select from users where ...`
-- entram em recursão infinita porque a própria tabela users tem RLS, que
-- tenta avaliar a policy de novo.
--
-- Solução padrão Supabase: helper function com SECURITY DEFINER, que bypassa
-- RLS quando executada. Policies usam a função em vez de subquery.
-- ============================================================================

-- 1. Function helper: retorna role do user logado bypassando RLS
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() limit 1;
$$;

-- 2. Function helper: true se user logado é admin ou hr_manager
create or replace function public.is_admin_or_hr()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('hr_manager', 'admin') from public.users where id = auth.uid() limit 1),
    false
  );
$$;

-- 3. Function helper: true se user logado é admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.users where id = auth.uid() limit 1),
    false
  );
$$;

-- Permissão de execução: authenticated pode chamar (a função internamente
-- usa security definer pra ler users mesmo com RLS bloqueado).
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin_or_hr() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ============================================================================
-- USERS
-- ============================================================================
drop policy if exists "HR and admin read all users" on public.users;
create policy "HR and admin read all users" on public.users
  for select to authenticated
  using (public.is_admin_or_hr());

-- ============================================================================
-- COMPANIES
-- ============================================================================
drop policy if exists "HR and admin read all companies" on public.companies;
create policy "HR and admin read all companies" on public.companies
  for select to authenticated
  using (public.is_admin_or_hr());

-- ============================================================================
-- COMPANY_USERS
-- ============================================================================
drop policy if exists "HR and admin read all company_users" on public.company_users;
create policy "HR and admin read all company_users" on public.company_users
  for select to authenticated
  using (public.is_admin_or_hr());

-- ============================================================================
-- RECRUITERS
-- ============================================================================
drop policy if exists "HR and admin read all recruiters" on public.recruiters;
create policy "HR and admin read all recruiters" on public.recruiters
  for select to authenticated
  using (public.is_admin_or_hr());

-- ============================================================================
-- JOBS
-- ============================================================================
drop policy if exists "HR and admin read all jobs" on public.jobs;
create policy "HR and admin read all jobs" on public.jobs
  for select to authenticated
  using (public.is_admin_or_hr());

drop policy if exists "HR and admin update jobs" on public.jobs;
create policy "HR and admin update jobs" on public.jobs
  for update to authenticated
  using (public.is_admin_or_hr());

-- ============================================================================
-- SUBMISSIONS
-- ============================================================================
drop policy if exists "HR and admin read all submissions" on public.submissions;
create policy "HR and admin read all submissions" on public.submissions
  for select to authenticated
  using (public.is_admin_or_hr());

drop policy if exists "HR and admin update submissions" on public.submissions;
create policy "HR and admin update submissions" on public.submissions
  for update to authenticated
  using (public.is_admin_or_hr());

-- ============================================================================
-- CANDIDATES (já existia em 20260530_candidates_rls_hardening.sql)
-- ============================================================================
drop policy if exists "HR and admin read all candidates" on public.candidates;
create policy "HR and admin read all candidates" on public.candidates
  for select to authenticated
  using (public.is_admin_or_hr());

-- ============================================================================
-- RECRUITER_SCORES (já existia em 20260530_recruiter_scores.sql)
-- ============================================================================
drop policy if exists "HR and admin read all scores" on public.recruiter_scores;
create policy "HR and admin read all scores" on public.recruiter_scores
  for select to authenticated
  using (public.is_admin_or_hr());

-- ============================================================================
-- AUDIT_EVENTS (admin only)
-- ============================================================================
-- A policy desta tabela provavelmente já existe via migration 20260529_audit_log.
-- Recria pra usar is_admin() helper, caso esteja com recursão.
do $$
declare
  policy_exists boolean;
begin
  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'audit_events'
  ) into policy_exists;

  if policy_exists then
    execute 'drop policy if exists "Admin reads audit" on public.audit_events';
    execute 'create policy "Admin reads audit" on public.audit_events
             for select to authenticated
             using (public.is_admin())';
  end if;
end $$;

-- ============================================================================
-- AI_USAGE_EVENTS
-- ============================================================================
drop policy if exists "Admin reads ai_usage" on public.ai_usage_events;
create policy "Admin reads ai_usage" on public.ai_usage_events
  for select to authenticated
  using (public.is_admin());
