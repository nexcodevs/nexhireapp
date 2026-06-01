-- ============================================================================
-- Sprint 17 — Avaliação comportamental/técnica (PRODUCT_VISION)
-- Data: 2026-06-04
--
-- Fecha o ciclo das Sprints 15/16: vaga gera perguntas pré-aprovadas →
-- HR aplica essas perguntas pra avaliar o candidato → IA score baseada
-- nas respostas → resultado vai pro detalhe.
-- ============================================================================

create table if not exists public.submission_assessments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  -- Quem aplicou a avaliação (HR que conduziu a entrevista)
  assessor_user_id uuid references public.users(id) on delete set null,
  -- Array de { question, answer, score (0-10), notes }
  answers jsonb not null default '[]'::jsonb,
  -- Scores agregados gerados pela IA (0-100)
  technical_score smallint,
  behavioral_score smallint,
  cultural_fit_score smallint,
  overall_score smallint,
  -- Resumo executivo da avaliação
  ai_summary text,
  -- Recomendação: avancar | revisar | rejeitar
  recommendation text,
  status text not null default 'in_progress',
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

create index if not exists idx_sa_submission
  on public.submission_assessments(submission_id);
create index if not exists idx_sa_assessor
  on public.submission_assessments(assessor_user_id);
create index if not exists idx_sa_status
  on public.submission_assessments(status);

comment on table public.submission_assessments is
  'Avaliações estruturadas que o HR aplica no candidato com as perguntas pré-aprovadas pela empresa.';
comment on column public.submission_assessments.answers is
  'Array de { question: string, answer: string, score: 0-10, notes?: string }';
comment on column public.submission_assessments.status is
  'in_progress | completed | cancelled';
comment on column public.submission_assessments.recommendation is
  'Recomendação final da IA: avancar | revisar | rejeitar';

alter table public.submission_assessments enable row level security;

-- HR e admin podem ler todas as avaliações
drop policy if exists "HR and admin read all assessments" on public.submission_assessments;
create policy "HR and admin read all assessments" on public.submission_assessments
  for select to authenticated
  using (public.is_admin_or_hr());

-- HR e admin inserem/atualizam (eles aplicam a avaliação)
drop policy if exists "HR and admin insert assessments" on public.submission_assessments;
create policy "HR and admin insert assessments" on public.submission_assessments
  for insert to authenticated
  with check (public.is_admin_or_hr());

drop policy if exists "HR and admin update assessments" on public.submission_assessments;
create policy "HR and admin update assessments" on public.submission_assessments
  for update to authenticated
  using (public.is_admin_or_hr());

-- Empresa lê avaliação completa das submissões enviadas pra ela
drop policy if exists "Companies read assessments of sent submissions" on public.submission_assessments;
create policy "Companies read assessments of sent submissions" on public.submission_assessments
  for select to authenticated
  using (
    status = 'completed'
    and exists (
      select 1
      from public.submissions s
      join public.jobs j on j.id = s.job_id
      join public.company_users cu on cu.company_id = j.company_id
      where s.id = submission_assessments.submission_id
        and cu.user_id = auth.uid()
        and s.status in (
          'sent_to_client', 'client_approved', 'client_rejected',
          'interview_scheduled', 'offer', 'hired', 'not_hired'
        )
    )
  );
