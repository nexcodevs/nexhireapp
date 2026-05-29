-- Auto-aprovação de hunter via IA
-- Roda no Supabase SQL Editor.

alter table public.recruiters
  add column if not exists bio text,
  add column if not exists years_experience int,
  add column if not exists ai_risk_assessment jsonb;

comment on column public.recruiters.bio is
  'Autodescrição curta do hunter (até ~300 chars). Coletada no signup.';

comment on column public.recruiters.years_experience is
  'Anos de experiência em recrutamento declarados pelo hunter.';

comment on column public.recruiters.ai_risk_assessment is
  'Resultado da análise IA: decision (auto_approve|needs_review|reject), confidence, reasoning, red_flags.';
