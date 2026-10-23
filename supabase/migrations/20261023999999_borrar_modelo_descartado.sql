-- Drops the discarded model for good. apartar_modelo_descartado already moved it to the legado schema.
-- The Supabase MCP holds drops for a human confirmation, so this one may run from the SQL Editor;
-- the file is renamed to the version the remote records.

drop policy if exists lead_photos_read_vendor on storage.objects;
drop policy if exists stock_photos_public_read on storage.objects;
drop policy if exists stock_photos_vendor_write on storage.objects;

drop schema if exists legado cascade;
