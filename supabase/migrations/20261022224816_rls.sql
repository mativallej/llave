-- RLS on every table. The only public read is the published stock.
-- Everything else goes through the service role from the server: the case token is resolved there,
-- and config never reaches the browser (the WhatsApp number ends up in a wa.me built server-side).

alter table public.auto enable row level security;
alter table public.caso enable row level security;
alter table public.acceso enable row level security;
alter table public.nota enable row level security;
alter table public.evento enable row level security;
alter table public.gasto_mes enable row level security;
alter table public.config enable row level security;

create policy auto_publicado_es_publico on public.auto
for select to anon, authenticated
using (publicado);
