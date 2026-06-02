-- ============================================================================
-- Submission_assessments: strengths, concerns e next_steps
-- Data: 2026-06-07
--
-- A IA já retorna strengths/concerns no /api/ai/assess-candidate mas o endpoint
-- nunca persistia esses campos — sumiam após reload da página. Adicionamos
-- também next_steps (texto livre) pro HR registrar ação combinada após a
-- entrevista (callback, próxima rodada, mandar pro cliente etc).
-- ============================================================================

alter table public.submission_assessments
  add column if not exists strengths jsonb not null default '[]'::jsonb,
  add column if not exists concerns jsonb not null default '[]'::jsonb,
  add column if not exists next_steps text;

comment on column public.submission_assessments.strengths is
  'Array de strings — pontos fortes identificados pela IA na avaliação.';
comment on column public.submission_assessments.concerns is
  'Array de strings — pontos de atenção/risco identificados pela IA.';
comment on column public.submission_assessments.next_steps is
  'Texto livre — próximos passos combinados pelo HR após a entrevista.';
