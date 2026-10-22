-- The discarded multi-tenant model (project created 2026-05-03). Dropped whole.
-- Everything is "if exists": on a fresh database this migration does nothing.

drop policy if exists lead_photos_read_vendor on storage.objects;
drop policy if exists stock_photos_public_read on storage.objects;
drop policy if exists stock_photos_vendor_write on storage.objects;

drop table if exists
  public.whatsapp_messages,
  public.lead_events,
  public.lead_photos,
  public.leads,
  public.interest_signups,
  public.stock_items,
  public.user_roles,
  public.tenants
cascade;

drop function if exists
  public.is_superadmin(uuid),
  public.is_vendor_of(uuid, uuid),
  public.lead_created_event(),
  public.lead_status_changed_event(),
  public.set_updated_at()
cascade;

drop type if exists
  public."Intention",
  public."LeadEventType",
  public."LeadStatus",
  public."PhotoKind",
  public."Role",
  public."WhatsappDirection"
cascade;
