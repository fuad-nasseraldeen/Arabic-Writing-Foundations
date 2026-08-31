-- Arabic Writing Foundations: auth, CMS and media schema. Apply with `supabase db push`.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, full_name text, avatar_url text, preferred_locale text check (preferred_locale in ('he','ar')) default 'he',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create or replace function public.is_admin(check_user uuid default auth.uid()) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.admins where user_id = check_user); $$;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id,email,full_name,avatar_url) values (new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), coalesce(new.raw_user_meta_data->>'avatar_url',new.raw_user_meta_data->>'picture')) on conflict (id) do update set email=excluded.email, full_name=coalesce(excluded.full_name,profiles.full_name), avatar_url=coalesce(excluded.avatar_url,profiles.avatar_url), updated_at=now(); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table public.categories (
 id uuid primary key default gen_random_uuid(), name_he text not null, name_ar text, description_he text, description_ar text,
 slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), icon text, color text, sort_order integer not null default 0, is_visible boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);
create table public.content_items (
 id uuid primary key default gen_random_uuid(), category_id uuid references public.categories(id) on delete restrict,
 title_he text not null, title_ar text, slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), excerpt_he text, excerpt_ar text, body_he text, body_ar text,
 cover_image_url text, status text not null default 'draft' check (status in ('draft','published')), sort_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz, created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);
create table public.media (
 id uuid primary key default gen_random_uuid(), storage_path text unique not null, file_name text not null, mime_type text not null,
 size_bytes bigint not null check (size_bytes >= 0), uploaded_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create index categories_sort_order_idx on public.categories(sort_order); create index content_category_idx on public.content_items(category_id); create index content_status_idx on public.content_items(status); create index media_created_at_idx on public.media(created_at desc);
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute procedure public.set_updated_at();
create trigger content_updated_at before update on public.content_items for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security; alter table public.admins enable row level security; alter table public.categories enable row level security; alter table public.content_items enable row level security; alter table public.media enable row level security;
create policy "profiles own read" on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
create policy "profiles own update" on public.profiles for update to authenticated using (id=auth.uid() or public.is_admin()) with check (id=auth.uid() or public.is_admin());
create policy "admins admin read" on public.admins for select to authenticated using (public.is_admin());
create policy "admins admin insert" on public.admins for insert to authenticated with check (public.is_admin());
create policy "admins admin delete" on public.admins for delete to authenticated using (public.is_admin() and (select count(*) from public.admins) > 1);
create policy "categories public visible" on public.categories for select using (is_visible or public.is_admin());
create policy "categories admin write" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "content public published" on public.content_items for select using (status='published' or public.is_admin());
create policy "content admin write" on public.content_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "media admin read" on public.media for select to authenticated using (public.is_admin());
create policy "media admin write" on public.media for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Create a private bucket in Dashboard named `site-media` (or make public if direct URLs are desired).
create policy "site media admin select" on storage.objects for select to authenticated using (bucket_id='site-media' and public.is_admin());
create policy "site media admin insert" on storage.objects for insert to authenticated with check (bucket_id='site-media' and public.is_admin());
create policy "site media admin delete" on storage.objects for delete to authenticated using (bucket_id='site-media' and public.is_admin());

-- Safe starter categories. Arabic text is supplied, and records remain editable in the CMS.
insert into public.categories (name_he,name_ar,slug,sort_order,is_visible) values
 ('אותיות בקבוצות','الحروف ضمن مجموعات','letters',1,true), ('דפי עבודה','أوراق عمل','worksheets',2,true), ('חומרי העשרה','مواد إثرائية','resources',3,true), ('טיפ השבוע','نصيحة الأسبوع','weekly-tip',4,true)
on conflict (slug) do nothing;
-- After the bootstrap email has logged in once, run exactly once in SQL Editor:
-- insert into public.admins(user_id) select id from auth.users where email='fuadnasiraldin@gmail.com' on conflict do nothing;
