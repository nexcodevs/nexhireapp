-- ============================================================================
-- Sprint 10 — Ranking de hunters (recruiter_scores + função + trigger)
-- Data: 2026-05-29
-- ============================================================================

-- 1. Tabela (idempotente — caso já tenha sido criada manualmente)
create table if not exists public.recruiter_scores (
  recruiter_id uuid primary key references public.recruiters(id) on delete cascade,
  total_submissions int not null default 0,
  total_hires int not null default 0,
  hr_approval_rate numeric(5, 2) not null default 0,
  client_approval_rate numeric(5, 2) not null default 0,
  hire_rate numeric(5, 2) not null default 0,
  duplicate_count int not null default 0,
  level text not null default 'beginner',
  overall_score numeric(5, 2) not null default 0,
  updated_at timestamp with time zone default now()
);

-- 2. Indexes pra ranking
create index if not exists idx_rs_overall on public.recruiter_scores(overall_score desc);
create index if not exists idx_rs_level_overall
  on public.recruiter_scores(level, overall_score desc);

-- 3. RLS
alter table public.recruiter_scores enable row level security;

drop policy if exists "Hunter reads own score" on public.recruiter_scores;
create policy "Hunter reads own score" on public.recruiter_scores
  for select to authenticated
  using (
    recruiter_id in (
      select id from public.recruiters where user_id = auth.uid()
    )
  );

drop policy if exists "HR and admin read all scores" on public.recruiter_scores;
create policy "HR and admin read all scores" on public.recruiter_scores
  for select to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role in ('hr_manager', 'admin')
    )
  );

-- 4. Função de cálculo + upsert + atualização de level
create or replace function public.refresh_recruiter_score(p_recruiter_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_terminal_decisions int;
  v_hr_approved int;
  v_client_approved int;
  v_hires int;
  v_duplicates int;
  v_hr_rate numeric;
  v_client_rate numeric;
  v_hire_rate numeric;
  v_overall numeric;
  v_level text;
begin
  -- Total de envios (todos os status)
  select count(*) into v_total
  from public.submissions
  where recruiter_id = p_recruiter_id;

  -- Decisões "terminais" do HR: aprovou, reprovou, mandou pra cliente, ou foi marcado como duplicado
  select count(*) into v_terminal_decisions
  from public.submissions
  where recruiter_id = p_recruiter_id
    and status in (
      'hr_approved','sent_to_client','client_approved','client_rejected',
      'interview_scheduled','offer','hired','hr_rejected','duplicate','not_hired'
    );

  -- Aprovados pelo HR (qualquer estágio pós-aprovação conta como passou pelo HR)
  select count(*) into v_hr_approved
  from public.submissions
  where recruiter_id = p_recruiter_id
    and status in (
      'hr_approved','sent_to_client','client_approved','client_rejected',
      'interview_scheduled','offer','hired','not_hired'
    );

  -- Aprovados pelo cliente (cliente OK ou que chegaram a entrevista/oferta/contratação)
  select count(*) into v_client_approved
  from public.submissions
  where recruiter_id = p_recruiter_id
    and status in ('client_approved','interview_scheduled','offer','hired');

  select count(*) into v_hires
  from public.submissions
  where recruiter_id = p_recruiter_id and status = 'hired';

  select count(*) into v_duplicates
  from public.submissions
  where recruiter_id = p_recruiter_id and status = 'duplicate';

  -- Taxas (em %)
  v_hr_rate := case when v_terminal_decisions > 0
                    then round(100.0 * v_hr_approved / v_terminal_decisions, 2)
                    else 0 end;

  v_client_rate := case when v_hr_approved > 0
                        then round(100.0 * v_client_approved / v_hr_approved, 2)
                        else 0 end;

  v_hire_rate := case when v_total > 0
                      then round(100.0 * v_hires / v_total, 2)
                      else 0 end;

  -- Overall (max 100 pts):
  --  HR rate (até 40 pts) + cliente rate (até 35 pts) + contratações (até 20 pts, 4pts cada até 5)
  --  + volume (até 5 pts, alvo 30 envios)
  v_overall := round(
    (v_hr_rate * 0.4)
    + (v_client_rate * 0.35)
    + (least(v_hires, 5) * 4.0)
    + (least(v_total, 30) / 30.0 * 5.0)
    , 2
  );
  if v_overall > 100 then v_overall := 100; end if;

  -- Nível: regras
  --   top_hunter   = >=30 envios E score >=80 E >=5 contratações
  --   specialist   = >=10 envios E score >=60
  --   beginner     = caso contrário
  if v_total >= 30 and v_overall >= 80 and v_hires >= 5 then
    v_level := 'top_hunter';
  elsif v_total >= 10 and v_overall >= 60 then
    v_level := 'specialist';
  else
    v_level := 'beginner';
  end if;

  -- Upsert na recruiter_scores
  insert into public.recruiter_scores (
    recruiter_id, total_submissions, total_hires,
    hr_approval_rate, client_approval_rate, hire_rate,
    duplicate_count, level, overall_score, updated_at
  )
  values (
    p_recruiter_id, v_total, v_hires,
    v_hr_rate, v_client_rate, v_hire_rate,
    v_duplicates, v_level, v_overall, now()
  )
  on conflict (recruiter_id) do update
  set
    total_submissions = excluded.total_submissions,
    total_hires = excluded.total_hires,
    hr_approval_rate = excluded.hr_approval_rate,
    client_approval_rate = excluded.client_approval_rate,
    hire_rate = excluded.hire_rate,
    duplicate_count = excluded.duplicate_count,
    level = excluded.level,
    overall_score = excluded.overall_score,
    updated_at = now();

  -- Propaga level pra recruiters.level (usado pra visibility filter)
  update public.recruiters
  set level = v_level
  where id = p_recruiter_id and level is distinct from v_level;
end;
$$;

-- 5. Recompute global (admin pode chamar pra rebuild da tabela inteira)
create or replace function public.refresh_all_recruiter_scores()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  cnt int := 0;
begin
  for r in select id from public.recruiters loop
    perform public.refresh_recruiter_score(r.id);
    cnt := cnt + 1;
  end loop;
  return cnt;
end;
$$;

-- 6. Trigger em submissions: refresh quando status muda ou submissão nova
create or replace function public.trg_refresh_recruiter_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.refresh_recruiter_score(new.recruiter_id);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    perform public.refresh_recruiter_score(new.recruiter_id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_submissions_refresh_score on public.submissions;
create trigger trg_submissions_refresh_score
  after insert or update of status on public.submissions
  for each row execute function public.trg_refresh_recruiter_score();
