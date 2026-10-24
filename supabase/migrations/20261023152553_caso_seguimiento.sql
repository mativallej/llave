-- The case link: each number with the date it was set, the appointment, the search, the freeze after the
-- proposal, and the transitions, each writing its event in the same transaction.

alter table public.caso
  add column fotos_en timestamptz,
  add column cita_en timestamptz,
  add column valor_toma_en timestamptz,
  add column precio_salida_en timestamptz,
  add column buscando_desde timestamptz,
  add column proximo_aviso date;

-- ─── Dates follow the numbers, and the published proposal freezes the case ───

create function public.caso_fechas() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.precio_salida is not null then new.precio_salida_en := coalesce(new.precio_salida_en, now()); end if;
    if new.valor_toma is not null then new.valor_toma_en := coalesce(new.valor_toma_en, now()); end if;
    if new.estado = 'pendiente_conseguir' then new.buscando_desde := coalesce(new.buscando_desde, now()); end if;
    return new;
  end if;

  -- After the proposal is published the case's data stays as it was: that is what makes
  -- "we don't renegotiate what was already informed" enforceable.
  if old.estado in ('propuesta_publicada', 'pendiente_entrega', 'cerrado')
     and (new.auto_entrega, new.salida, new.auto_busca, new.auto_ids, new.zona, new.valor_toma, new.precio_salida,
          new.nombre, new.telefono)
         is distinct from
         (old.auto_entrega, old.salida, old.auto_busca, old.auto_ids, old.zona, old.valor_toma, old.precio_salida,
          old.nombre, old.telefono) then
    raise exception 'La propuesta ya está publicada: los datos del caso no se cambian.' using errcode = 'P0001';
  end if;

  if new.precio_salida is distinct from old.precio_salida then
    new.precio_salida_en := case when new.precio_salida is null then null else now() end;
  end if;
  if new.valor_toma is distinct from old.valor_toma then
    new.valor_toma_en := case when new.valor_toma is null then null else now() end;
  end if;
  if new.estado = 'pendiente_conseguir' and old.estado <> 'pendiente_conseguir' then
    new.buscando_desde := now();
  end if;
  return new;
end $$;

create trigger caso_fechas before insert or update on public.caso
for each row execute function public.caso_fechas();

-- ─── The photos that came with the request count as received ───────────────

create or replace function public.crear_pedido(
  p_telefono text,
  p_nombre text,
  p_estado text,
  p_auto_entrega jsonb,
  p_salida text,
  p_auto_busca text,
  p_auto_ids uuid[],
  p_zona text,
  p_precio_salida numeric,
  p_token_cliente text,
  p_token_operador text,
  p_meta jsonb
) returns table (caso_id uuid, caso_ref text, caso_creado_en timestamptz)
language plpgsql set search_path = '' as $$
declare
  v_caso public.caso;
begin
  insert into public.caso (telefono, nombre, estado, auto_entrega, salida, auto_busca, auto_ids, zona, precio_salida, fotos_en)
  values (p_telefono, p_nombre, p_estado, p_auto_entrega, p_salida, p_auto_busca, coalesce(p_auto_ids, '{}'), p_zona,
          p_precio_salida, case when coalesce((p_meta ->> 'fotos')::int, 0) > 0 then now() end)
  returning * into v_caso;

  insert into public.acceso (token, caso_id, rol) values
    (p_token_cliente, v_caso.id, 'cliente'),
    (p_token_operador, v_caso.id, 'operador');

  insert into public.evento (caso_id, tipo, meta) values (v_caso.id, 'pedido_enviado', coalesce(p_meta, '{}'));

  return query select v_caso.id, v_caso.ref, v_caso.creado_en;
end $$;

-- ─── Opening a link: the first time it is recorded, and for the operator it's a funnel event ───

create function public.abrir_acceso(p_token text)
returns table (acceso_rol text, acceso_caso uuid, primera boolean)
language plpgsql set search_path = '' as $$
declare
  v public.acceso;
begin
  update public.acceso set abierto_en = now() where token = p_token and abierto_en is null returning * into v;
  if found then
    if v.rol = 'operador' then
      insert into public.evento (caso_id, tipo) values (v.caso_id, 'caso_abierto_operador');
    end if;
    return query select v.rol, v.caso_id, true;
    return;
  end if;
  return query select a.rol, a.caso_id, false from public.acceso a where a.token = p_token;
end $$;

-- ─── Every transition: state, the fields it sets, its event, and a sale consumes the stock car ───

create function public.mover_caso(
  p_caso uuid,
  p_desde text[],
  p_hacia text,
  p_cambios jsonb,
  p_evento text,
  p_meta jsonb
) returns public.caso
language plpgsql set search_path = '' as $$
declare
  v public.caso;
  c jsonb := coalesce(p_cambios, '{}');
begin
  select * into v from public.caso where id = p_caso for update;
  if not found then
    raise exception 'No existe ese caso.' using errcode = 'P0001';
  end if;
  if p_desde is not null and not (v.estado = any (p_desde)) then
    raise exception 'El caso está en %: esto no se puede hacer ahora.', v.estado using errcode = 'P0001';
  end if;

  update public.caso set
    estado = coalesce(p_hacia, estado),
    nombre = case when c ? 'nombre' then c ->> 'nombre' else nombre end,
    auto_entrega = case when c ? 'auto_entrega' then nullif(c -> 'auto_entrega', 'null'::jsonb) else auto_entrega end,
    salida = case when c ? 'salida' then c ->> 'salida' else salida end,
    auto_busca = case when c ? 'auto_busca' then c ->> 'auto_busca' else auto_busca end,
    auto_ids = case when c ? 'auto_ids'
                    then array(select jsonb_array_elements_text(c -> 'auto_ids'))::uuid[] else auto_ids end,
    zona = case when c ? 'zona' then c ->> 'zona' else zona end,
    valor_toma = case when c ? 'valor_toma' then (c ->> 'valor_toma')::numeric else valor_toma end,
    precio_salida = case when c ? 'precio_salida' then (c ->> 'precio_salida')::numeric else precio_salida end,
    vence_prop = case when c ? 'vence_prop' then (c ->> 'vence_prop')::timestamptz else vence_prop end,
    cita_en = case when c ? 'cita_en' then (c ->> 'cita_en')::timestamptz else cita_en end,
    fotos_en = case when c ? 'fotos_en' then (c ->> 'fotos_en')::timestamptz else fotos_en end,
    proximo_aviso = case when c ? 'proximo_aviso' then (c ->> 'proximo_aviso')::date else proximo_aviso end,
    cerro = case when c ? 'cerro' then (c ->> 'cerro')::boolean else cerro end,
    motivo_perdida = case when c ? 'motivo_perdida' then c ->> 'motivo_perdida' else motivo_perdida end,
    venta_nueva = case when c ? 'venta_nueva' then (c ->> 'venta_nueva')::boolean else venta_nueva end,
    renegocio = case when c ? 'renegocio' then (c ->> 'renegocio')::boolean else renegocio end
  where id = p_caso
  returning * into v;

  if p_evento is not null then
    insert into public.evento (caso_id, tipo, meta) values (p_caso, p_evento, coalesce(p_meta, '{}'));
  end if;

  -- A sale consumes the stock car it took: sold and unpublished, with nobody having to remember.
  if p_evento = 'venta_cerrada' then
    update public.auto set vendido_en = now(), publicado = false
    where id = any (v.auto_ids) and vendido_en is null;
  end if;

  return v;
end $$;

revoke execute on function public.abrir_acceso(text) from public, anon, authenticated;
revoke execute on function public.mover_caso(uuid, text[], text, jsonb, text, jsonb) from public, anon, authenticated;
revoke execute on function public.crear_pedido(text, text, text, jsonb, text, text, uuid[], text, numeric, text, text, jsonb)
  from public, anon, authenticated;
