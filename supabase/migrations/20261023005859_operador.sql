-- Who can operate the channel from Claude, through the MCP. The token is the authentication, like the
-- case links: each call resolves its role before running anything. No public access.

create table public.operador (
  token text primary key check (token ~ '^[A-Za-z0-9_-]{32,}$'),
  nombre text not null,
  rol text not null check (rol in ('falkenberg', 'vendedor')),
  creado_en timestamptz not null default now(),
  ultimo_uso timestamptz                             -- what says whether the MCP gets used or is decoration
);

alter table public.operador enable row level security;
