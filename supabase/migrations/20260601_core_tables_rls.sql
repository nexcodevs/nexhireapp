-- ============================================================================
-- Endurecimento de RLS nas tabelas centrais
-- Data: 2026-06-01
--
-- Migration idempotente: habilita RLS + cria policies por papel pras tabelas
-- centrais que podem ter sido criadas com RLS desabilitada.
--
-- Se RLS já estava habilitada com policies via Dashboard, esta migration
-- só re-cria as policies (drop + create). Não quebra nada.
-- ============================================================================

-- ============================================================================
-- USERS
-- ============================================================================
alter table public.users enable row level security;

drop policy if exists "User reads own profile" on public.users;
create policy "User reads own profile" on public.users
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "User updates own profile" on public.users;
create policy "User updates own profile" on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "HR and admin read all users" on public.users;
create policy "HR and admin read all users" on public.users
  for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
    )
  );

-- Insert via service_role apenas (sign-up usa trigger ou admin client)

-- ============================================================================
-- COMPANIES
-- ============================================================================
alter table public.companies enable row level security;

drop policy if exists "Company members read own company" on public.companies;
create policy "Company members read own company" on public.companies
  for select to authenticated
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = companies.id and cu.user_id = auth.uid()
    )
  );

drop policy if exists "HR and admin read all companies" on public.companies;
create policy "HR and admin read all companies" on public.companies
  for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
    )
  );

-- Hunter aprovado vê apenas dados básicos via join com jobs (não direto na tabela)
drop policy if exists "Recruiters read companies of open jobs" on public.companies;
create policy "Recruiters read companies of open jobs" on public.companies
  for select to authenticated
  using (
    exists (
      select 1 from public.recruiters r
      where r.user_id = auth.uid() and r.status = 'approved'
    )
    and exists (
      select 1 from public.jobs j
      where j.company_id = companies.id
        and j.status in ('open_for_hunters', 'submission_closed', 'in_hr_curation')
    )
  );

drop policy if exists "Company members insert company" on public.companies;
create policy "Company members insert company" on public.companies
  for insert to authenticated
  with check (true);  -- onboarding cria empresa antes do company_users; service role idealmente

drop policy if exists "Company members update own company" on public.companies;
create policy "Company members update own company" on public.companies
  for update to authenticated
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = companies.id and cu.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = companies.id and cu.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMPANY_USERS
-- ============================================================================
alter table public.company_users enable row level security;

drop policy if exists "User reads own company memberships" on public.company_users;
create policy "User reads own company memberships" on public.company_users
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Company members read same company memberships" on public.company_users;
create policy "Company members read same company memberships" on public.company_users
  for select to authenticated
  using (
    company_id in (
      select cu.company_id from public.company_users cu where cu.user_id = auth.uid()
    )
  );

drop policy if exists "HR and admin read all company_users" on public.company_users;
create policy "HR and admin read all company_users" on public.company_users
  for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
    )
  );

drop policy if exists "User inserts own membership" on public.company_users;
create policy "User inserts own membership" on public.company_users
  for insert to authenticated
  with check (user_id = auth.uid());

-- ============================================================================
-- RECRUITERS
-- ============================================================================
alter table public.recruiters enable row level security;

drop policy if exists "Recruiter reads own profile" on public.recruiters;
create policy "Recruiter reads own profile" on public.recruiters
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "HR and admin read all recruiters" on public.recruiters;
create policy "HR and admin read all recruiters" on public.recruiters
  for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
    )
  );

-- Empresa lê dados básicos do hunter que enviou candidato pra vaga sua
drop policy if exists "Companies read recruiters of own submissions" on public.recruiters;
create policy "Companies read recruiters of own submissions" on public.recruiters
  for select to authenticated
  using (
    exists (
      select 1 from public.submissions s
      join public.jobs j on j.id = s.job_id
      join public.company_users cu on cu.company_id = j.company_id
      where s.recruiter_id = recruiters.id and cu.user_id = auth.uid()
    )
  );

drop policy if exists "User inserts own recruiter profile" on public.recruiters;
create policy "User inserts own recruiter profile" on public.recruiters
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "User updates own recruiter profile" on public.recruiters;
create policy "User updates own recruiter profile" on public.recruiters
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- JOBS
-- ============================================================================
alter table public.jobs enable row level security;

drop policy if exists "Company members read own jobs" on public.jobs;
create policy "Company members read own jobs" on public.jobs
  for select to authenticated
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = jobs.company_id and cu.user_id = auth.uid()
    )
  );

drop policy if exists "HR and admin read all jobs" on public.jobs;
create policy "HR and admin read all jobs" on public.jobs
  for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
    )
  );

drop policy if exists "Approved recruiters read open jobs" on public.jobs;
create policy "Approved recruiters read open jobs" on public.jobs
  for select to authenticated
  using (
    jobs.status in ('open_for_hunters', 'submission_closed', 'in_hr_curation')
    and exists (
      select 1 from public.recruiters r
      where r.user_id = auth.uid() and r.status = 'approved'
    )
  );

drop policy if exists "Company members insert jobs" on public.jobs;
create policy "Company members insert jobs" on public.jobs
  for insert to authenticated
  with check (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = jobs.company_id and cu.user_id = auth.uid()
    )
  );

drop policy if exists "Company members update own jobs" on public.jobs;
create policy "Company members update own jobs" on public.jobs
  for update to authenticated
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = jobs.company_id and cu.user_id = auth.uid()
    )
  );

drop policy if exists "HR and admin update jobs" on public.jobs;
create policy "HR and admin update jobs" on public.jobs
  for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
    )
  );

-- ============================================================================
-- SUBMISSIONS
-- ============================================================================
alter table public.submissions enable row level security;

drop policy if exists "Recruiter reads own submissions" on public.submissions;
create policy "Recruiter reads own submissions" on public.submissions
  for select to authenticated
  using (
    exists (
      select 1 from public.recruiters r
      where r.id = submissions.recruiter_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "HR and admin read all submissions" on public.submissions;
create policy "HR and admin read all submissions" on public.submissions
  for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
    )
  );

-- Empresa lê submissões enviadas pras suas vagas (em status visível pra empresa)
drop policy if exists "Companies read submissions of own jobs" on public.submissions;
create policy "Companies read submissions of own jobs" on public.submissions
  for select to authenticated
  using (
    submissions.status in (
      'sent_to_client', 'client_approved', 'client_rejected',
      'interview_scheduled', 'offer', 'hired', 'not_hired'
    )
    and exists (
      select 1 from public.jobs j
      join public.company_users cu on cu.company_id = j.company_id
      where j.id = submissions.job_id and cu.user_id = auth.uid()
    )
  );

drop policy if exists "Recruiter inserts own submissions" on public.submissions;
create policy "Recruiter inserts own submissions" on public.submissions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.recruiters r
      where r.id = submissions.recruiter_id and r.user_id = auth.uid() and r.status = 'approved'
    )
  );

-- HR/Admin atualizam (curadoria, mudança de status)
drop policy if exists "HR and admin update submissions" on public.submissions;
create policy "HR and admin update submissions" on public.submissions
  for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('hr_manager', 'admin')
    )
  );

-- Empresa atualiza submissões dela (decisão de cliente)
drop policy if exists "Companies update own submissions" on public.submissions;
create policy "Companies update own submissions" on public.submissions
  for update to authenticated
  using (
    exists (
      select 1 from public.jobs j
      join public.company_users cu on cu.company_id = j.company_id
      where j.id = submissions.job_id and cu.user_id = auth.uid()
    )
  );

-- Nenhuma policy de DELETE. Submissões nunca devem ser apagadas — só status muda.
