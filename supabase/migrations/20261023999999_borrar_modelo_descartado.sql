-- Drops the discarded model for good. apartar_modelo_descartado already moved it to the legado schema.
-- The Supabase MCP holds drops for a human confirmation that never reaches the session, so this one runs
-- from the SQL Editor, which also records it in the migration history under this file's version.
--
-- No "drop policy ... on storage.objects": storage.objects belongs to supabase_storage_admin, and the role
-- the SQL Editor runs as can't drop its policies. Two of the three old ones (lead_photos_read_vendor and
-- stock_photos_vendor_write) depend on legado.user_roles and go with the cascade. The third,
-- stock_photos_public_read, only reads the 'stock-photos' bucket, which doesn't exist; it's removed from
-- Storage → Policies in the dashboard.

drop schema if exists legado cascade;
