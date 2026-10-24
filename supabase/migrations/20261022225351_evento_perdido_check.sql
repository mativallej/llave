-- The first version of this check let caso_perdido through without por_silencio: with meta = '{}',
-- jsonb_typeof() is null, and a check that evaluates to null passes. Coalesce it to false.

alter table public.evento drop constraint evento_perdido_distingue_silencio;

alter table public.evento add constraint evento_perdido_distingue_silencio check (
  tipo <> 'caso_perdido' or coalesce(jsonb_typeof(meta -> 'por_silencio') = 'boolean', false)
);
