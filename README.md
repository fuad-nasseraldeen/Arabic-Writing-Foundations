# קדם־כתיבה בערבית

מדריך דיגיטלי מקצועי לפרויקט גמר לתואר שני בריפוי בעיסוק באוניברסיטת תל־אביב. האתר עוסק בקידום מיומנויות קדם־כתיבה ורכישת כתיבת אותיות בערבית בקרב ילדים בגילאי 4–7.

## טכנולוגיות

Next.js (App Router), TypeScript, React, Tailwind CSS v4, Lucide React ו־`next/font`.

## Supabase, authentication and CMS

The application uses `@supabase/ssr` cookie sessions and has locale routes at `/he` (default) and `/ar`. The root path redirects to `/he`; the language switcher preserves the current route.

1. Create a Supabase project and copy its Project URL and **publishable/anon** key into `.env.local` using `.env.example`.
2. Apply the single consolidated migration: `supabase/migrations/20260831000000_initial_schema.sql` (or use `supabase db push`).
3. In Storage, create the `site-media` bucket. Make it public only if direct public media URLs are desired; otherwise adapt the media page to use signed URLs.
4. In Authentication → URL Configuration, keep the production address as **Site URL** (it is only a fallback). Under **Redirect URLs**, add `http://localhost:3000/**` and `https://arabic-writing-foundations.vercel.app/**`. If using Vercel preview deployments, also add the preview wildcard supplied by your Vercel team, for example `https://*-YOUR-TEAM.vercel.app/**`. The browser login code explicitly returns to the origin where login began.
5. In Google Cloud Console, configure the same Supabase callback URL shown by Supabase under the Google provider (normally `https://PROJECT_REF.supabase.co/auth/v1/callback`) as an authorized redirect URI.
6. Sign in once with `fuadnasiraldin@gmail.com`, then run the commented bootstrap statement at the end of the migration in Supabase SQL Editor. Refresh `/he/admin`.

No service-role key is used by the app. Never expose one in `NEXT_PUBLIC_*` variables. Set the two `NEXT_PUBLIC_SUPABASE_*` values in Vercel → Project Settings → Environment Variables for Production/Preview, and configure the matching Vercel callback URL in both Supabase and Google.

## Controlled visual CMS

The initial migration is intentionally consolidated: it creates Auth profiles, roles, RLS, Storage policies and bucket, the bilingual CMS, predefined themes, revisions, and all initial public cards in one fresh-project migration.

### Fresh database reset

This is destructive. Back up anything you need first. In Supabase SQL Editor, reset public application data and media objects, then apply the consolidated migration:

```sql
drop schema public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
```

Do not delete rows directly from `storage.objects` or `storage.buckets`: Supabase blocks direct SQL deletion intentionally. In Dashboard → Storage, delete the `site-media` bucket through its menu (this removes its files safely). The consolidated migration recreates it. Do not delete `auth.users` unless you deliberately want to remove every login. After applying the migration, sign in once with `fuadnasiraldin@gmail.com` and run the bootstrap statement at the end of the migration to restore the first administrator.

## הפעלה מקומית

```bash
npm install
npm run dev
```

לבדיקת גרסת ייצור: `npm run build` ואז `npm start`.

## מבנה

- `src/app` — מסלולים ודפים.
- `src/components` — רכיבי ממשק חוזרים.
- `src/data` — תוכן סטטי, כולל מודל האותיות.

## עריכת תוכן

האותיות והקבוצות נמצאות ב־`src/data/letters.ts`. כדי להוסיף אות, מוסיפים אובייקט מסוג `ArabicLetter` ומגדירים `slug` ייחודי; התבנית ב־`/letters/[slug]` מציגה אותו אוטומטית. נתוני הקבוצות מסומנים במפורש כטיוטה עד לאישור מקצועי.

דפי עבודה ומשאבים עתידיים יכולים לקבל מערכי נתונים ייעודיים ב־`src/data` ולשמש את דפי `worksheets` ו־`resources`; אין צורך בשירות צד־שרת בשלב זה.

## פריסה

הפרויקט מוכן לפריסה ב־Vercel: העלו למאגר Git, יבאו את המאגר ב־Vercel, והשאירו את פקודת הבנייה `npm run build`.
