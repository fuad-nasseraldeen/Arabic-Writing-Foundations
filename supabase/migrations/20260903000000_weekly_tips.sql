-- A dedicated collection for the rotating public Weekly Tip.  This deliberately
-- remains independent from site_sections and site_items.
create table if not exists public.weekly_tips (
  id uuid primary key default gen_random_uuid(),
  title_he text not null check (char_length(trim(title_he)) > 0),
  title_ar text,
  description_he text not null check (char_length(trim(description_he)) > 0),
  description_ar text,
  category text,
  icon_key text not null default 'lightbulb'
    check (icon_key in ('lightbulb', 'leaf', 'brain', 'star', 'pencil', 'book')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create index if not exists weekly_tips_active_sort_idx
  on public.weekly_tips (sort_order, created_at, id)
  where is_active;

create trigger weekly_tips_updated_at
  before update on public.weekly_tips
  for each row execute procedure public.set_updated_at();

alter table public.weekly_tips enable row level security;
create policy "weekly tips public active read" on public.weekly_tips
  for select using (is_active or public.is_admin());
create policy "weekly tips admin write" on public.weekly_tips
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.weekly_tips to anon, authenticated;
grant insert, update, delete on public.weekly_tips to authenticated;

-- Preserve the formerly hard-coded public tip as the first persistent record.
insert into public.weekly_tips (title_he, description_he, category, icon_key, is_active, sort_order)
select
  'הפרידו בין רכיבי האות',
  'בעת תרגול אות הכוללת גוף ונקודה, אפשר לאפשר לילד להשלים תחילה את הגוף ורק לאחר מכן להוסיף את הנקודה. כך ניתן להתבונן בנפרד ברצף התנועה ובמיקום במרחב.',
  'כתיבה',
  'lightbulb',
  true,
  1
where not exists (select 1 from public.weekly_tips);
