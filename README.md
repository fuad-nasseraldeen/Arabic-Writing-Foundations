# קדם־כתיבה בערבית

מדריך דיגיטלי מקצועי לפרויקט גמר לתואר שני בריפוי בעיסוק באוניברסיטת תל־אביב. האתר עוסק בקידום מיומנויות קדם־כתיבה ורכישת כתיבת אותיות בערבית בקרב ילדים בגילאי 4–7.

## טכנולוגיות

Next.js (App Router), TypeScript, React, Tailwind CSS v4, Lucide React ו־`next/font`.

## Supabase, authentication and CMS

The application uses `@supabase/ssr` cookie sessions and has locale routes at `/he` (default) and `/ar`. The root path redirects to `/he`; the language switcher preserves the current route.

1. Create a Supabase project and copy its Project URL and **publishable/anon** key into `.env.local` using `.env.example`.
2. In Supabase Dashboard, run the migration in `supabase/migrations/20260831220000_cms_auth_i18n.sql` (or use `supabase db push`).
3. In Storage, create the `site-media` bucket. Make it public only if direct public media URLs are desired; otherwise adapt the media page to use signed URLs.
4. In Authentication → Providers, enable Google, enter the Google OAuth client ID/secret, and add `http://localhost:3000/auth/callback` plus the production `https://YOUR-DOMAIN/auth/callback` redirect URLs.
5. In Google Cloud Console, configure the same Supabase callback URL shown by Supabase under the Google provider (normally `https://PROJECT_REF.supabase.co/auth/v1/callback`) as an authorized redirect URI.
6. Sign in once with `fuadnasiraldin@gmail.com`, then run the commented bootstrap statement at the end of the migration in Supabase SQL Editor. Refresh `/he/admin`.

No service-role key is used by the app. Never expose one in `NEXT_PUBLIC_*` variables. Set the two `NEXT_PUBLIC_SUPABASE_*` values in Vercel → Project Settings → Environment Variables for Production/Preview, and configure the matching Vercel callback URL in both Supabase and Google.

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