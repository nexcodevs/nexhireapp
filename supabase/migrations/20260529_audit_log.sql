-- Audit log: registro imutável de ações sensíveis na plataforma.
-- Útil pra LGPD, disputas, debug e revisão de operação.

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  actor_role text,
  action text not null,
  target_type text not null,
  target_id uuid,
  payload jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_audit_actor on public.audit_events(actor_id);
create index if not exists idx_audit_target on public.audit_events(target_type, target_id);
create index if not exists idx_audit_created on public.audit_events(created_at desc);
create index if not exists idx_audit_action on public.audit_events(action);

alter table public.audit_events enable row level security;

-- Apenas admin pode ler audit (info sensível)
create policy "Admin reads audit"
  on public.audit_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Insert vem via service_role (helper logAudit usa admin client).
-- Sem policy de update/delete: audit é imutável.

comment on table public.audit_events is
  'Audit log imutável. Insert via service_role. SELECT restrito a admin.';

comment on column public.audit_events.action is
  'Identificador da ação: <domain>.<verb>. Ex: submission.approved, hunter.rejected, job.published.';

comment on column public.audit_events.payload is
  'Contexto adicional (before/after/reason/...). Não inclui PII bruto.';
