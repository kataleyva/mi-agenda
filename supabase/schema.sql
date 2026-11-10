-- Mi Agenda: tabla donde se guarda la agenda de cada persona.
-- Pégalo completo en Supabase → SQL Editor → New query → Run.

create table if not exists public.agendas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.agendas enable row level security;

drop policy if exists "Cada quien ve su agenda" on public.agendas;
create policy "Cada quien ve su agenda" on public.agendas
  for select using (auth.uid() = user_id);

drop policy if exists "Cada quien crea su agenda" on public.agendas;
create policy "Cada quien crea su agenda" on public.agendas
  for insert with check (auth.uid() = user_id);

drop policy if exists "Cada quien edita su agenda" on public.agendas;
create policy "Cada quien edita su agenda" on public.agendas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Avisos en tiempo real cuando cambias algo desde otro dispositivo
do $$
begin
  alter publication supabase_realtime add table public.agendas;
exception when duplicate_object then null;
end $$;
