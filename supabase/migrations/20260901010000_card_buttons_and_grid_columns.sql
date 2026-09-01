alter table public.site_items add column if not exists show_button boolean not null default false;
alter table public.site_items drop constraint if exists site_items_cta_href_check;
alter table public.site_items add constraint site_items_cta_href_check check (cta_href is null or cta_href ~ '^(\/(he|ar))?\/?[A-Za-z0-9_./#?=&%-]*$' or cta_href ~ '^https?:\/\/[^[:space:]]+$');
update public.site_items set show_button=true where cta_label_he is not null or cta_label_ar is not null;
