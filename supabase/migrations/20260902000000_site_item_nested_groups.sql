-- Additive nested groups for CMS cards. This migration intentionally does not
-- change existing rows, policies, storage objects, or delete behaviour.
alter table public.site_items
  add column if not exists parent_id uuid null,
  add column if not exists click_behavior text null
    check (click_behavior is null or click_behavior in ('content', 'link', 'media', 'children'));

-- A parent may not be removed while it still has child cards. This protects
-- production content and lets the application present a clear admin message.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_items_parent_id_fkey'
  ) then
    alter table public.site_items
      add constraint site_items_parent_id_fkey
      foreign key (parent_id) references public.site_items(id) on delete restrict;
  end if;
end $$;

create index if not exists site_items_parent_sort_idx
  on public.site_items(parent_id, sort_order)
  where deleted_at is null;
