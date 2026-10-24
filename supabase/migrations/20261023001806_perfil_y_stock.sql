-- The admin's users and two columns the stock screens need.

-- Who can enter /admin and with which role. A Supabase Auth session without a row here gets nothing:
-- access is granted by the service role creating this row, never by signing up.
create table public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('falkenberg', 'vendedor')),
  creado_en timestamptz not null default now()
);

alter table public.perfil enable row level security;

-- The version the agent reads from the line or the badge ("XEI", "Highline").
alter table public.auto add column version text;

-- Manual order of the published stock: the first six are "Autos de esta semana". Null goes last.
alter table public.auto add column orden integer;
