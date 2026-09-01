-- Structured presentation metadata for the single media attachment on each CMS card.
alter table public.site_items
  add column if not exists media_title_he text,
  add column if not exists media_title_ar text,
  add column if not exists media_size text not null default 'medium' check (media_size in ('small','medium','large')),
  add column if not exists media_fit text not null default 'cover' check (media_fit in ('cover','contain')),
  add column if not exists media_position text not null default 'top' check (media_position in ('top','bottom')),
  add column if not exists original_file_name text,
  add column if not exists media_mime_type text;
