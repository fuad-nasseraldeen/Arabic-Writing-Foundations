-- Structured, bilingual worksheet library.  Files remain in the existing
-- site-media bucket; this migration stores only their public URLs/metadata.

create table public.worksheet_skills (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check(key ~ '^[a-z0-9-]+$'),
  name_he text not null,
  name_ar text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_he text not null,
  name_ar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.worksheets (
  id uuid primary key default gen_random_uuid(),
  title_he text not null,
  title_ar text,
  description_he text,
  description_ar text,
  therapeutic_goal_he text,
  therapeutic_goal_ar text,
  difficulty text not null default 'medium' check(difficulty in ('easy','medium','hard')),
  skill_id uuid references public.worksheet_skills(id) on delete set null,
  activity_type text not null default 'other' check(activity_type in ('tracing','copying','completion','matching','sorting','independent-writing','visual-discrimination','multi-sensory','other')),
  age_group text check(age_group in ('4-5','5-6','6-7','all') or age_group is null),
  letter_group_id uuid references public.site_items(id) on delete set null,
  thumbnail_url text,
  file_url text,
  file_type text check(file_type in ('image','pdf') or file_type is null),
  original_file_name text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table public.worksheet_tags (
  worksheet_id uuid not null references public.worksheets(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete restrict,
  primary key (worksheet_id, tag_id)
);

create index worksheets_visible_sort_idx on public.worksheets(is_visible, sort_order) where deleted_at is null;
create index worksheets_difficulty_idx on public.worksheets(difficulty) where deleted_at is null;
create index worksheets_skill_idx on public.worksheets(skill_id) where deleted_at is null;
create index worksheets_activity_idx on public.worksheets(activity_type) where deleted_at is null;
create index worksheets_age_idx on public.worksheets(age_group) where deleted_at is null;
create index worksheets_letter_group_idx on public.worksheets(letter_group_id) where deleted_at is null;
create index worksheet_tags_tag_idx on public.worksheet_tags(tag_id, worksheet_id);

create trigger worksheet_skills_updated_at before update on public.worksheet_skills for each row execute procedure public.set_updated_at();
create trigger tags_updated_at before update on public.tags for each row execute procedure public.set_updated_at();
create trigger worksheets_updated_at before update on public.worksheets for each row execute procedure public.set_updated_at();

alter table public.worksheet_skills enable row level security;
alter table public.tags enable row level security;
alter table public.worksheets enable row level security;
alter table public.worksheet_tags enable row level security;

create policy "worksheet skills public read" on public.worksheet_skills for select using(is_visible or public.is_admin());
create policy "worksheet skills admin write" on public.worksheet_skills for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "tags public read" on public.tags for select using(true);
create policy "tags admin write" on public.tags for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "worksheets public visible" on public.worksheets for select using((is_visible and deleted_at is null) or public.is_admin());
create policy "worksheets admin write" on public.worksheets for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "worksheet tags public read" on public.worksheet_tags for select using(exists(select 1 from public.worksheets w where w.id=worksheet_id and ((w.is_visible and w.deleted_at is null) or public.is_admin())));
create policy "worksheet tags admin write" on public.worksheet_tags for all to authenticated using(public.is_admin()) with check(public.is_admin());

grant select on public.worksheet_skills, public.tags, public.worksheets, public.worksheet_tags to anon, authenticated;
grant insert, update, delete on public.worksheet_skills, public.tags, public.worksheets, public.worksheet_tags to authenticated;

insert into public.worksheet_skills(key,name_he,name_ar,sort_order) values
 ('tracing','עקיבה','التتبع',1),
 ('line-control','שליטה בקו','التحكم بالخط',2),
 ('pre-writing-lines','קווים קדם־כתיבתיים','الخطوط التمهيدية للكتابة',3),
 ('visual-discrimination','הבחנה חזותית','التمييز البصري',4),
 ('visual-motor-integration','אינטגרציה חזותית־מוטורית','التكامل البصري الحركي',5),
 ('directionality','כיווניות','الاتجاهية',6),
 ('eye-hand-coordination','תיאום עין־יד','التآزر البصري الحركي',7),
 ('fine-motor','מוטוריקה עדינה','المهارات الحركية الدقيقة',8),
 ('letter-writing','כתיבת אות','كتابة الحرف',9),
 ('letter-connection','חיבור אותיות','وصل الحروف',10),
 ('dot-placement','מיקום נקודות','مواضع النقاط',11),
 ('motor-planning','תכנון מוטורי','التخطيط الحركي',12)
on conflict(key) do nothing;
