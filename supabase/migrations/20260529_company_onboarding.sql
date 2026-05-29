-- Onboarding de empresa: aceite explícito dos termos de uso
-- Roda no Supabase SQL Editor.

alter table public.company_users
  add column if not exists tos_accepted_at timestamp with time zone,
  add column if not exists tos_version text;

comment on column public.company_users.tos_accepted_at is
  'Timestamp do aceite explícito dos Termos de Uso + Política de Privacidade. NULL = não aceitou.';

comment on column public.company_users.tos_version is
  'Versão dos termos aceitos (ex: "2026-05-29"). Permite forçar re-aceite em mudanças.';
