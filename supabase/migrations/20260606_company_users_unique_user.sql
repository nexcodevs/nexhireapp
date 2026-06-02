-- ============================================================================
-- UNIQUE constraint em company_users.user_id (modelo 1:1 user→empresa)
-- Data: 2026-06-06
--
-- Sintoma: usuários acumulavam vínculos duplicados (35 empresas pro
-- adm@nexco.cc, 3 pro adm@globo.com). Endpoint de onboarding usa
-- .maybeSingle() pra checar se user já tem empresa; quando havia >1 vínculo,
-- PostgREST retorna null + erro, código ignora erro e cria empresa nova.
-- Cada novo login multiplicava o problema.
--
-- Decisão de produto (2026-06-02): user pertence a no máximo 1 empresa.
-- Constraint no banco impede a regressão e fixa todos os .maybeSingle()
-- da codebase (vão ter sempre 0 ou 1 row garantido).
-- ============================================================================

alter table public.company_users
add constraint company_users_user_id_unique unique (user_id);
