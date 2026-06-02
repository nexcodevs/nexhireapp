-- ============================================================================
-- LGPD: aceite de termos no signup pra todos os perfis
-- Data: 2026-06-08
--
-- Empresa já tinha tos_accepted_at em company_users (via onboarding). Hunter
-- e candidato não tinham nada. Adicionamos em public.users — base comum a
-- todos os perfis. Versão fica em texto pra rastrear updates futuros dos
-- termos sem precisar re-aceitar via migration.
-- ============================================================================

alter table public.users
  add column if not exists tos_accepted_at timestamptz,
  add column if not exists tos_version text;

comment on column public.users.tos_accepted_at is
  'Timestamp do aceite dos Termos de Uso + Política de Privacidade no signup.';
comment on column public.users.tos_version is
  'Versão dos termos aceitos (ex: 2026-06-02). Usado pra forçar re-aceite quando publicar versão nova.';
