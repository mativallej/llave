-- Writing an event moves caso.ultimo_evento in the same transaction, whoever writes it:
-- the web, the case link or the MCP.

create function public.evento_actualiza_caso() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.caso_id is not null then
    update public.caso
    set ultimo_evento = greatest(coalesce(ultimo_evento, new.en), new.en)
    where id = new.caso_id;
  end if;
  return new;
end $$;

create trigger evento_actualiza_caso after insert on public.evento
for each row execute function public.evento_actualiza_caso();
