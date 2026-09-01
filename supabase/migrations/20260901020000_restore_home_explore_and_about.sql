-- Restore the original homepage explore cards and the project/about preview.
-- This is idempotent so it is safe for an existing CMS database as well as a reset.

insert into public.site_sections (key, page_key, section_type, title_he, title_ar, subtitle_he, subtitle_ar, sort_order, settings)
values
  ('home.project', 'home', 'content', 'מטרת המיזם', 'هدف المشروع', null, null, 4, '{"columns":1}'::jsonb),
  ('home.author', 'home', 'author', 'היכרות', 'تعارف', null, null, 5, '{"columns":1}'::jsonb)
on conflict (key) do update set
  title_he = excluded.title_he,
  title_ar = excluded.title_ar,
  updated_at = now();

update public.site_sections
set settings = settings || '{"columns":3}'::jsonb,
    updated_at = now()
where key = 'home.explore';

insert into public.site_items (
  section_id, item_type, title_he, title_ar, description_he, description_ar,
  show_button, cta_label_he, cta_label_ar, cta_href, icon_key, variant, sort_order
)
select section.id, 'feature_card', source.title_he, source.title_ar, source.description_he, source.description_ar,
       true, source.cta_label_he, source.cta_label_ar, source.cta_href, source.icon_key, source.variant, source.sort_order
from public.site_sections section
join (values
  ('home.explore', 'לפי אות', 'حسب الحرف', 'הכירו את צורת האות, מופעיה והאתגרים האפשריים.', 'تعرّفوا إلى شكل الحرف وظهوره والتحديات المحتملة.', 'למעבר', 'انتقال', '/letters', 'pencil', 'sage', 1),
  ('home.explore', 'לפי מיומנות', 'حسب المهارة', 'זהו את דרישת הביצוע שמאחורי הקושי בכתיבה.', 'تعرّفوا إلى متطلبات الأداء الكامنة وراء صعوبات الكتابة.', 'למעבר', 'انتقال', '/skills', 'brain', 'peach', 2),
  ('home.explore', 'לפי פעילות', 'حسب النشاط', 'מצאו כיוונים להתערבות ולתרגול מדורג.', 'اعثروا على اتجاهات للتدخل والتدريب المتدرج.', 'למעבר', 'انتقال', '/worksheets', 'book', 'lavender', 3)
) as source(section_key, title_he, title_ar, description_he, description_ar, cta_label_he, cta_label_ar, cta_href, icon_key, variant, sort_order)
  on section.key = source.section_key
where not exists (
  select 1 from public.site_items existing
  where existing.section_id = section.id and existing.title_he = source.title_he and existing.deleted_at is null
);

insert into public.site_items (
  section_id, item_type, title_he, title_ar, description_he, description_ar,
  show_button, cta_label_he, cta_label_ar, cta_href, variant, sort_order
)
select section.id, 'feature_card', source.title_he, source.title_ar, source.description_he, source.description_ar,
       true, source.cta_label_he, source.cta_label_ar, source.cta_href, source.variant, 1
from public.site_sections section
join (values
  ('home.project', 'על הפרויקט', 'عن المشروع', 'המדריך פותח במסגרת פרויקט גמר לתואר שני בריפוי בעיסוק באוניברסיטת תל־אביב, במטרה להנגיש ידע וכלים מקצועיים לקידום מיומנויות קדם־כתיבה וכתיבת אותיות בערבית בקרב ילדים בגילאי 4–7.', 'تم تطوير الدليل ضمن مشروع تخرج للماجستير في العلاج الوظيفي بجامعة تل أبيب، بهدف إتاحة المعرفة والأدوات المهنية لتنمية مهارات ما قبل الكتابة وكتابة الحروف العربية لدى الأطفال في سن 4–7.', 'קראו עוד על הפרויקט', 'اقرأوا المزيد عن المشروع', '/project', 'peach'),
  ('home.author', 'חיסאן ג׳בר־נאצר אלדין', 'حسان جبر-ناصر الدين', 'מרפאה בעיסוק וסטודנטית לתואר שני בריפוי בעיסוק באוניברסיטת תל־אביב.', 'معالجة وظيفية وطالبة ماجستير في العلاج الوظيفي بجامعة تل أبيب.', 'קראו עוד עליי', 'اقرأوا المزيد عني', '/about', 'sage')
) as source(section_key, title_he, title_ar, description_he, description_ar, cta_label_he, cta_label_ar, cta_href, variant)
  on section.key = source.section_key
where not exists (
  select 1 from public.site_items existing
  where existing.section_id = section.id and existing.title_he = source.title_he and existing.deleted_at is null
);
