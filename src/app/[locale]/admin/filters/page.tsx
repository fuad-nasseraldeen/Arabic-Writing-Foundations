import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { FilterManager } from "@/components/admin/FilterManager";
import type { FilterGroup, FilterOption } from "@/lib/worksheet-types";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const supabase = await createClient();
  const [groupsResult, assignmentsResult] = await Promise.all([
    supabase.from("filter_groups").select("id,key,label_he,label_ar,selection_mode,sort_order,is_visible,filter_options(id,group_id,key,label_he,label_ar,sort_order,is_visible)").order("sort_order"),
    supabase.from("worksheet_filter_options").select("option_id"),
  ]);
  if (groupsResult.error) throw new Error(groupsResult.error.message);
  if (assignmentsResult.error) throw new Error(assignmentsResult.error.message);
  const usage = (assignmentsResult.data || []).reduce<Record<string, number>>((counts, row) => { counts[row.option_id] = (counts[row.option_id] || 0) + 1; return counts; }, {});
  const groups = ((groupsResult.data || []) as Array<Omit<FilterGroup, "options"> & { filter_options: FilterOption[] }>).map((group) => ({ ...group, options: (group.filter_options || []).sort((a, b) => a.sort_order - b.sort_order), usage }));
  return <><h1>{locale === "he" ? "ניהול פילטרים" : "إدارة المرشحات"}</h1><p className="muted-note">{locale === "he" ? "קבוצות ואפשרויות המסננים של דפי העבודה." : "مجموعات وخيارات تصفية أوراق العمل."}</p><FilterManager locale={locale} groups={groups} /></>;
}
