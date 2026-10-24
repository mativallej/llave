-- One private bucket for every photo: the stock's and the clients'. Read only through signed URLs.
-- No storage.objects policies: only the service role, from the server, reads and writes it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos',
  'fotos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;
