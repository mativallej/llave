-- Rate limits for the public endpoints: a fixed-window counter in Postgres. No new service and no job queue.
-- The key is the limit's name plus a hash of the IP, never the IP.

create table public.limite (
  clave text not null,
  ventana timestamptz not null,
  cuenta integer not null default 0,
  primary key (clave, ventana)
);

alter table public.limite enable row level security;
-- No policies: only the service role reads or writes it.

-- One statement counts and answers, so two requests at the same instant don't step on each other.
-- True while the window's count is within the maximum.
create or replace function public.contar_uso(p_clave text, p_segundos integer, p_maximo integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ventana timestamptz := to_timestamp(floor(extract(epoch from now()) / p_segundos) * p_segundos);
  v_cuenta integer;
begin
  insert into public.limite (clave, ventana, cuenta) values (p_clave, v_ventana, 1)
  on conflict (clave, ventana) do update set cuenta = public.limite.cuenta + 1
  returning cuenta into v_cuenta;

  -- Old windows go on the way, now and then: nothing else has to clean this table.
  if random() < 0.02 then
    delete from public.limite where ventana < now() - interval '2 days';
  end if;

  return v_cuenta <= p_maximo;
end $$;

revoke execute on function public.contar_uso(text, integer, integer) from public, anon, authenticated;
