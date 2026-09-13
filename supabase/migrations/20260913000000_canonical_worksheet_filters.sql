-- One-time worksheet filter consolidation. Legacy worksheet columns/tables remain
-- for rollback only; runtime reads and writes switch to these tables after this migration.

create table public.filter_groups (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key ~ '^[a-z0-9-]+$'),
  label_he text not null,
  label_ar text not null,
  selection_mode text not null check (selection_mode in ('single','multi')),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.filter_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.filter_groups(id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9-]+$'),
  label_he text not null,
  label_ar text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, key)
);

create table public.worksheet_filter_options (
  worksheet_id uuid not null references public.worksheets(id) on delete cascade,
  option_id uuid not null references public.filter_options(id) on delete cascade,
  primary key (worksheet_id, option_id)
);

create index filter_options_group_visible_sort_idx on public.filter_options(group_id, is_visible, sort_order);
create index worksheet_filter_options_option_worksheet_idx on public.worksheet_filter_options(option_id, worksheet_id);

create trigger filter_groups_updated_at before update on public.filter_groups for each row execute procedure public.set_updated_at();
create trigger filter_options_updated_at before update on public.filter_options for each row execute procedure public.set_updated_at();

alter table public.filter_groups enable row level security;
alter table public.filter_options enable row level security;
alter table public.worksheet_filter_options enable row level security;

create policy "filter groups public read" on public.filter_groups for select using(is_visible or public.is_admin());
create policy "filter groups admin write" on public.filter_groups for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "filter options public read" on public.filter_options for select using(
  public.is_admin() or (is_visible and exists(select 1 from public.filter_groups g where g.id = group_id and g.is_visible))
);
create policy "filter options admin write" on public.filter_options for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "worksheet filters public read" on public.worksheet_filter_options for select using(
  exists(
    select 1 from public.worksheets w
    join public.filter_options o on o.id = option_id
    join public.filter_groups g on g.id = o.group_id
    where w.id = worksheet_id
      and ((w.is_visible and w.deleted_at is null and o.is_visible and g.is_visible) or public.is_admin())
  )
);
create policy "worksheet filters admin write" on public.worksheet_filter_options for all to authenticated using(public.is_admin()) with check(public.is_admin());

grant select on public.filter_groups, public.filter_options, public.worksheet_filter_options to anon, authenticated;
grant insert, update, delete on public.filter_groups, public.filter_options, public.worksheet_filter_options to authenticated;

insert into public.filter_groups(key,label_he,label_ar,selection_mode,sort_order) values
  ('skill','מיומנות','مهارة','multi',1),
  ('activity','סוג פעילות','نوع النشاط','multi',2),
  ('difficulty','רמת קושי','مستوى الصعوبة','single',3),
  ('age','גיל מומלץ','العمر المقترح','multi',4),
  ('tag','תגית','وسم','multi',5)
on conflict(key) do update set label_he=excluded.label_he,label_ar=excluded.label_ar,selection_mode=excluded.selection_mode,sort_order=excluded.sort_order;

insert into public.filter_options(group_id,key,label_he,label_ar,sort_order,is_visible)
select g.id, s.key, s.name_he, coalesce(s.name_ar, s.name_he), s.sort_order, s.is_visible
from public.worksheet_skills s join public.filter_groups g on g.key='skill'
on conflict(group_id,key) do update set label_he=excluded.label_he,label_ar=excluded.label_ar,sort_order=excluded.sort_order,is_visible=excluded.is_visible;

insert into public.filter_options(group_id,key,label_he,label_ar,sort_order)
select g.id, v.key, v.he, v.ar, v.ord from public.filter_groups g cross join (values
  ('tracing','עקיבה','التتبع',1),('copying','העתקה','النسخ',2),('completion','השלמה','الإكمال',3),('matching','התאמה','المطابقة',4),('sorting','מיון','الفرز',5),('independent-writing','כתיבה עצמאית','الكتابة المستقلة',6),('visual-discrimination','הבחנה חזותית','التمييز البصري',7),('multi-sensory','פעילות רב־חושית','نشاط متعدد الحواس',8),('other','אחר','أخرى',9)
) as v(key,he,ar,ord) where g.key='activity'
on conflict(group_id,key) do update set label_he=excluded.label_he,label_ar=excluded.label_ar,sort_order=excluded.sort_order;

insert into public.filter_options(group_id,key,label_he,label_ar,sort_order)
select g.id, v.key, v.he, v.ar, v.ord from public.filter_groups g cross join (values
  ('easy','קל','سهل',1),('medium','בינוני','متوسط',2),('hard','קשה','صعب',3)
) as v(key,he,ar,ord) where g.key='difficulty'
on conflict(group_id,key) do update set label_he=excluded.label_he,label_ar=excluded.label_ar,sort_order=excluded.sort_order;

insert into public.filter_options(group_id,key,label_he,label_ar,sort_order)
select g.id, v.key, v.he, v.ar, v.ord from public.filter_groups g cross join (values
  ('4-5','גיל 4–5','العمر 4–5',1),('5-6','גיל 5–6','العمر 5–6',2),('6-7','גיל 6–7','العمر 6–7',3),('all','כל הגילאים','جميع الأعمار',4)
) as v(key,he,ar,ord) where g.key='age'
on conflict(group_id,key) do update set label_he=excluded.label_he,label_ar=excluded.label_ar,sort_order=excluded.sort_order;

insert into public.filter_options(group_id,key,label_he,label_ar,sort_order)
select g.id, t.slug, t.name_he, coalesce(t.name_ar, t.name_he), (row_number() over(order by t.name_he))::integer
from public.tags t join public.filter_groups g on g.key='tag'
on conflict(group_id,key) do update set label_he=excluded.label_he,label_ar=excluded.label_ar;

insert into public.worksheet_filter_options(worksheet_id,option_id)
select w.id, o.id from public.worksheets w
join public.worksheet_skills s on s.id=w.skill_id
join public.filter_groups g on g.key='skill'
join public.filter_options o on o.group_id=g.id and o.key=s.key
where w.deleted_at is null
on conflict do nothing;

insert into public.worksheet_filter_options(worksheet_id,option_id)
select w.id, o.id from public.worksheets w
join public.filter_groups g on g.key='activity'
join public.filter_options o on o.group_id=g.id and o.key=w.activity_type
where w.deleted_at is null
on conflict do nothing;

insert into public.worksheet_filter_options(worksheet_id,option_id)
select w.id, o.id from public.worksheets w
join public.filter_groups g on g.key='difficulty'
join public.filter_options o on o.group_id=g.id and o.key=w.difficulty
where w.deleted_at is null
on conflict do nothing;

insert into public.worksheet_filter_options(worksheet_id,option_id)
select w.id, o.id from public.worksheets w
join public.filter_groups g on g.key='age'
join public.filter_options o on o.group_id=g.id and o.key=w.age_group
where w.deleted_at is null and w.age_group is not null
on conflict do nothing;

insert into public.worksheet_filter_options(worksheet_id,option_id)
select wt.worksheet_id, o.id from public.worksheet_tags wt
join public.tags t on t.id=wt.tag_id
join public.filter_groups g on g.key='tag'
join public.filter_options o on o.group_id=g.id and o.key=t.slug
on conflict do nothing;

comment on column public.worksheets.skill_id is 'Legacy rollback data. Runtime uses worksheet_filter_options.';
comment on column public.worksheets.difficulty is 'Legacy rollback data. Runtime uses worksheet_filter_options.';
comment on column public.worksheets.activity_type is 'Legacy rollback data. Runtime uses worksheet_filter_options.';
comment on column public.worksheets.age_group is 'Legacy rollback data. Runtime uses worksheet_filter_options.';
comment on table public.worksheet_skills is 'Legacy rollback data. Runtime uses filter_groups/filter_options.';
comment on table public.tags is 'Legacy rollback data. Runtime uses filter_groups/filter_options.';
comment on table public.worksheet_tags is 'Legacy rollback data. Runtime uses worksheet_filter_options.';
