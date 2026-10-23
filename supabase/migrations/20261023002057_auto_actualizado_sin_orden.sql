-- "Days since the last update" is the stale-stock warning. Reordering the featured six touches orden,
-- and that must not reset the clock: a sold car that keeps being reordered would never be flagged.

create function public.auto_actualizado_en() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new) - 'orden' - 'actualizado_en') is distinct from (to_jsonb(old) - 'orden' - 'actualizado_en') then
    new.actualizado_en := now();
  end if;
  return new;
end $$;

create or replace trigger auto_actualizado_en before update on public.auto
for each row execute function public.auto_actualizado_en();
