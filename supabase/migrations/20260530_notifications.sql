-- Notificações in-app por usuário.
-- Inseridas pelo backend (service_role) em paralelo aos emails.
-- Lidas via RLS pelo próprio usuário; sino consome via Realtime.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index if not exists idx_notif_user_created
  on public.notifications(user_id, created_at desc);
create index if not exists idx_notif_user_unread
  on public.notifications(user_id, read_at)
  where read_at is null;

alter table public.notifications enable row level security;

-- User só lê e atualiza suas próprias notificações
drop policy if exists "User reads own notifications" on public.notifications;
create policy "User reads own notifications" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "User updates own notifications" on public.notifications;
create policy "User updates own notifications" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts vêm exclusivamente via service_role (não há policy de insert pra authenticated)

-- Habilita Realtime (necessário pro canal postgres_changes funcionar)
alter publication supabase_realtime add table public.notifications;
