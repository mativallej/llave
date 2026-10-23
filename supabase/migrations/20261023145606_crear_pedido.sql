-- A confirmed request creates the case, its two accesses and the pedido_enviado event in one transaction:
-- the funnel's first step is written in the same operation that produces it, or not at all.

create function public.crear_pedido(
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
  insert into public.caso (telefono, nombre, estado, auto_entrega, salida, auto_busca, auto_ids, zona, precio_salida)
  values (p_telefono, p_nombre, p_estado, p_auto_entrega, p_salida, p_auto_busca, coalesce(p_auto_ids, '{}'), p_zona, p_precio_salida)
  returning * into v_caso;

  insert into public.acceso (token, caso_id, rol) values
    (p_token_cliente, v_caso.id, 'cliente'),
    (p_token_operador, v_caso.id, 'operador');

  insert into public.evento (caso_id, tipo, meta) values (v_caso.id, 'pedido_enviado', coalesce(p_meta, '{}'));

  return query select v_caso.id, v_caso.ref, v_caso.creado_en;
end $$;

revoke execute on function public.crear_pedido(text, text, text, jsonb, text, text, uuid[], text, numeric, text, text, jsonb)
  from public, anon, authenticated;
