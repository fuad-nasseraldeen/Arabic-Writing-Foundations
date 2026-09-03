import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import type { WeeklyTip } from "@/lib/weekly-tips";
import { WeeklyTipManager } from "@/components/admin/WeeklyTipManager";

export default async function WeeklyTipsAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_tips")
    .select(
      "id,title_he,title_ar,description_he,description_ar,category,icon_key,is_active,sort_order,created_at,updated_at",
    )
    .order("sort_order")
    .order("created_at")
    .order("id");
  if (error) throw new Error(error.message);
  return (
    <>
      <span className="eyebrow">
        {locale === "he" ? "ניהול תוכן מתמשך" : "إدارة محتوى مستمر"}
      </span>
      <h1>{locale === "he" ? "טיפים" : "النصائح"}</h1>
      <p className="lead">
        {locale === "he"
          ? "הטיפים הפעילים מוצגים לציבור ברוטציה קבועה של חמישה ימים."
          : "تظهر النصائح النشطة للجمهور ضمن تدوير ثابت كل خمسة أيام."}
      </p>
      <WeeklyTipManager locale={locale} tips={(data || []) as WeeklyTip[]} />
    </>
  );
}
