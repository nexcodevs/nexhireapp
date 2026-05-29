-- ============================================================================
-- Bloco 3.5 — Validações anti-fraude do hunter no envio
-- Data: 2026-05-28
--
-- Adiciona 3 colunas a `submissions`:
--  - jd_priorities: texto livre com os 3 pontos da vaga que o hunter priorizou
--  - hunter_score: nota 1-10 que o hunter dá pro fit do candidato com a vaga
--  - hunter_score_rationale: justificativa da nota
--
-- Todas as colunas são NOT NULL com default vazio pra não quebrar rows existentes.
-- Code-level: o form força preenchimento; banco aceita string vazia em rows antigas.
-- ============================================================================

alter table public.submissions
  add column if not exists jd_priorities text not null default '',
  add column if not exists hunter_score smallint check (hunter_score is null or (hunter_score between 1 and 10)),
  add column if not exists hunter_score_rationale text not null default '';

-- Backfill: rows existentes ficam com strings vazias e hunter_score null
update public.submissions
set jd_priorities = coalesce(jd_priorities, ''),
    hunter_score_rationale = coalesce(hunter_score_rationale, '')
where jd_priorities is null or hunter_score_rationale is null;
