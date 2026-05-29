-- Tracking de consumo de IA por chamada.
-- Permite painel admin com custo por feature/user/dia + base pra cobrança no futuro.

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  feature text not null,
  provider text not null,
  model text,
  input_tokens int,
  output_tokens int,
  duration_ms int,
  cost_usd numeric(10, 6),
  metadata jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists idx_aiu_user on public.ai_usage_events(user_id);
create index if not exists idx_aiu_feature on public.ai_usage_events(feature);
create index if not exists idx_aiu_created on public.ai_usage_events(created_at desc);
create index if not exists idx_aiu_user_feature_date
  on public.ai_usage_events(user_id, feature, created_at desc);

alter table public.ai_usage_events enable row level security;

-- Apenas admin pode ler (info sensível de consumo + custo)
drop policy if exists "Admin reads ai_usage" on public.ai_usage_events;
create policy "Admin reads ai_usage" on public.ai_usage_events
  for select to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- Insert via service_role (helper logAIUsage usa admin client).

comment on table public.ai_usage_events is
  'Registro imutável de cada chamada IA. Base pra observability + billing.';
