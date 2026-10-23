-- Dropping the discarded model needs a human confirmation the Supabase MCP can't show in this session
-- (fundacion-datos 0.1). Meanwhile it moves out of public: out of the API, out of the generated types,
-- nothing lost. Dropping it for good is then `drop schema legado cascade`.
-- Only moves what exists, so on a fresh database it just creates an empty schema.

create schema if not exists legado;
revoke all on schema legado from public, anon, authenticated;

do $$
declare
  r record;
begin
  for r in
    select c.relname from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
      and c.relname in ('whatsapp_messages', 'lead_events', 'lead_photos', 'leads',
                        'interest_signups', 'stock_items', 'user_roles', 'tenants')
  loop
    execute format('alter table public.%I set schema legado', r.relname);
  end loop;

  for r in
    select p.oid::regprocedure as fn from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('is_superadmin', 'is_vendor_of', 'lead_created_event',
                        'lead_status_changed_event', 'set_updated_at')
  loop
    execute format('alter function %s set schema legado', r.fn);
  end loop;

  for r in
    select t.typname from pg_type t
    where t.typnamespace = 'public'::regnamespace and t.typtype = 'e'
      and t.typname in ('Intention', 'LeadEventType', 'LeadStatus', 'PhotoKind', 'Role', 'WhatsappDirection')
  loop
    execute format('alter type public.%I set schema legado', r.typname);
  end loop;
end $$;
