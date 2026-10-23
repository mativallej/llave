-- Suspending an admin user: banned in Supabase Auth so they can't sign in again, and marked here so an
-- already open session loses access on its next request. Null means active.
alter table public.perfil add column suspendido_en timestamptz;
