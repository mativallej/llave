-- The schema of the case, the stock and the funnel events.
-- The names of caso.estado and evento.tipo are a contract: changing them later means migrating data.

create function public.set_actualizado_en() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

-- ─── auto: the stock ─────────────────────────────────────────────────────────

create table public.auto (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  marca text,
  modelo text,
  anio integer check (anio between 1950 and 2100),
  km integer check (km >= 0),
  precio numeric(14, 2) check (precio > 0),          -- public and exact; only ever typed by a person
  segmento text,
  fotos text[] not null default '{}',                -- storage paths in the "fotos" bucket
  publicado boolean not null default false,
  vendido_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint auto_publicado_con_precio check (not publicado or precio is not null),
  constraint auto_vendido_no_publicado check (vendido_en is null or not publicado)
);

create trigger auto_actualizado_en before update on public.auto
for each row execute function public.set_actualizado_en();

-- ─── caso ────────────────────────────────────────────────────────────────────

create function public.nueva_ref() returns text
language plpgsql volatile set search_path = '' as $$
declare
  r text;
begin
  loop
    r := 'LL-' || (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from public.caso where ref = r);
  end loop;
  return r;
end $$;

create table public.caso (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.nueva_ref(),
  telefono text not null,                            -- the index: the only id shared by the web, WhatsApp and a call
  nombre text,
  estado text not null check (estado in (
    'pendiente_fotos',
    'pendiente_cita',
    'pendiente_inspeccion',
    'pendiente_tasacion',
    'pendiente_conseguir',
    'pendiente_propuesta',
    'propuesta_publicada',
    'pendiente_entrega',
    'cerrado'
  )),
  auto_entrega jsonb,                                -- null: hands nothing in
  salida text check (salida in ('usado', '0km')),
  auto_busca text,
  auto_ids uuid[] not null default '{}',
  zona text,
  valor_toma numeric(14, 2) check (valor_toma >= 0), -- only Andrés writes it, after seeing the car
  precio_salida numeric(14, 2) check (precio_salida >= 0),
  vence_prop timestamptz,
  cerro boolean,                                     -- true: closed with a sale; false: lost
  motivo_perdida text,
  venta_nueva boolean,                               -- true = would NOT have come without the channel; null = not asked
  renegocio boolean not null default false,
  creado_en timestamptz not null default now(),
  ultimo_evento timestamptz
);

create index caso_telefono_idx on public.caso (telefono, creado_en desc);

-- ─── acceso: the token is the authentication ─────────────────────────────────

create table public.acceso (
  token text primary key check (token ~ '^[A-Za-z0-9_-]{22}$'),
  caso_id uuid not null references public.caso (id) on delete cascade,
  rol text not null check (rol in ('cliente', 'operador')),
  abierto_en timestamptz,
  unique (caso_id, rol)
);

-- ─── nota ────────────────────────────────────────────────────────────────────

create table public.nota (
  id bigint generated always as identity primary key,
  caso_id uuid not null references public.caso (id) on delete cascade,
  texto text not null check (length(btrim(texto)) > 0),
  autor text,
  creada_en timestamptz not null default now()
);

create index nota_caso_idx on public.nota (caso_id, creada_en);

-- ─── evento: one row per funnel step, written when it happens ────────────────

create table public.evento (
  id bigserial primary key,
  caso_id uuid references public.caso (id),          -- no cascade: deleting a case must not erase history
  tipo text not null check (tipo in (
    'chat_iniciado',
    'pedido_enviado',
    'caso_abierto_operador',
    'cita_agendada',
    'cita_cumplida',
    'propuesta_publicada',
    'venta_cerrada',
    'caso_perdido',
    'renegociacion'
  )),
  meta jsonb not null default '{}',
  en timestamptz not null default now(),
  constraint evento_con_caso check (caso_id is not null or tipo = 'chat_iniciado'),
  constraint evento_perdido_distingue_silencio check (
    tipo <> 'caso_perdido' or jsonb_typeof(meta -> 'por_silencio') = 'boolean'
  )
);

create index evento_tipo_en_idx on public.evento (tipo, en);
create index evento_caso_en_idx on public.evento (caso_id, en);

-- ─── gasto_mes: ad spend, typed by hand because it lives in Andrés's Meta account

create table public.gasto_mes (
  mes date primary key check (mes = date_trunc('month', mes)::date),
  monto numeric(14, 2) not null check (monto >= 0)
);

-- ─── config: operational data, not a build secret. Changes without a redeploy.

create table public.config (
  clave text primary key,
  valor text not null default '',
  nota text not null,
  actualizado_en timestamptz not null default now(),
  constraint config_garantias_booleano check (
    clave <> 'garantias_falkenberg' or valor in ('true', 'false')
  )
);

create trigger config_actualizado_en before update on public.config
for each row execute function public.set_actualizado_en();

insert into public.config (clave, valor, nota) values
  ('whatsapp_abelardo', '',
   'El WhatsApp de Abelardo, con código de país y sin espacios ni signos (ej. 5493492000000). Arma el link wa.me del handoff. Mientras esté vacío el handoff no se puede generar.'),
  ('garantias_falkenberg', 'false',
   'Las cinco garantías que paga Falkenberg. Queda en false hasta que Andrés las acepte por escrito. En true se publican en la home, sin redeploy.'),
  ('plazo_contacto', '',
   'La redacción del plazo de contacto de 48 horas. Todavía no está decidida: vacío hasta que se decida.');

revoke execute on function public.nueva_ref() from public, anon, authenticated;
