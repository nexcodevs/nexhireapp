-- ============================================================================
-- LGPD: solicitação de exclusão de conta (processamento manual em até 15d)
-- Data: 2026-06-09
--
-- User pede exclusão via /perfil → marca deletion_requested_at. Admin
-- revisa em audit_events e processa manualmente (anonimização ou hard
-- delete conforme regra interna). LGPD Art. 18 permite até 15 dias úteis.
-- ============================================================================

alter table public.users
  add column if not exists deletion_requested_at timestamptz;

comment on column public.users.deletion_requested_at is
  'Timestamp da solicitação de exclusão pelo próprio user (LGPD Art. 18). Processamento manual pelo admin.';

create index if not exists idx_users_deletion_requested
  on public.users(deletion_requested_at)
  where deletion_requested_at is not null;
