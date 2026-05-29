-- Cache do pitch IA do candidato (gerado sob demanda pela empresa).
-- Evita regerar a cada abertura da página de detalhe do candidato.

alter table public.submissions
  add column if not exists ai_pitch jsonb,
  add column if not exists ai_pitch_generated_at timestamp with time zone;

comment on column public.submissions.ai_pitch is
  'Cache do pitch IA: { pitch, match_percent, strengths[], gaps[], risks[] }. Gerado sob demanda.';
