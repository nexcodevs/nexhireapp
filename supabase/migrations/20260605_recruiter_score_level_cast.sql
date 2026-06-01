-- ============================================================================
-- Hotfix — cast explícito de level (text → recruiter_level)
-- Data: 2026-06-05
--
-- Sintoma: 'column "level" is of type recruiter_level but expression is of
-- type text' ao inserir submissão. Trigger trg_refresh_recruiter_score chama
-- refresh_recruiter_score, que atualiza recruiters.level com v_level (text)
-- sem cast pro enum.
-- ============================================================================

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
  select count(*) into v_total
  from public.submissions
  where recruiter_id = p_recruiter_id;

  select count(*) into v_terminal_decisions
  from public.submissions
  where recruiter_id = p_recruiter_id
    and status in (
      'hr_approved','sent_to_client','client_approved','client_rejected',
      'interview_scheduled','offer','hired','hr_rejected','duplicate','not_hired'
    );

  select count(*) into v_hr_approved
  from public.submissions
  where recruiter_id = p_recruiter_id
    and status in (
      'hr_approved','sent_to_client','client_approved','client_rejected',
      'interview_scheduled','offer','hired','not_hired'
    );

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

  v_hr_rate := case when v_terminal_decisions > 0
                    then round(100.0 * v_hr_approved / v_terminal_decisions, 2)
                    else 0 end;

  v_client_rate := case when v_hr_approved > 0
                        then round(100.0 * v_client_approved / v_hr_approved, 2)
                        else 0 end;

  v_hire_rate := case when v_total > 0
                      then round(100.0 * v_hires / v_total, 2)
                      else 0 end;

  v_overall := round(
    (v_hr_rate * 0.4)
    + (v_client_rate * 0.35)
    + (least(v_hires, 5) * 4.0)
    + (least(v_total, 30) / 30.0 * 5.0)
    , 2
  );
  if v_overall > 100 then v_overall := 100; end if;

  if v_total >= 30 and v_overall >= 80 and v_hires >= 5 then
    v_level := 'top_hunter';
  elsif v_total >= 10 and v_overall >= 60 then
    v_level := 'specialist';
  else
    v_level := 'beginner';
  end if;

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

  -- HOTFIX: cast pro enum recruiter_level
  update public.recruiters
  set level = v_level::recruiter_level
  where id = p_recruiter_id and level::text is distinct from v_level;
end;
$$;
