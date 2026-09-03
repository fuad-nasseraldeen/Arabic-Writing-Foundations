import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";

export type WeeklyTip = {
  id: string;
  title_he: string;
  title_ar: string | null;
  description_he: string;
  description_ar: string | null;
  category: string | null;
  icon_key: "lightbulb" | "leaf" | "brain" | "star" | "pencil" | "book";
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const WEEKLY_TIP_EPOCH = Date.UTC(2026, 0, 1);
const ROTATION_MS = 5 * 24 * 60 * 60 * 1000;

const fetchActiveWeeklyTips = async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("weekly_tips")
    .select(
      "id,title_he,title_ar,description_he,description_ar,category,icon_key,is_active,sort_order,created_at,updated_at",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  // A clean empty state is preferable to exposing a database error publicly.
  // This also permits a zero-downtime deployment while the additive migration
  // is being applied to Supabase.
  if (error) return [] as WeeklyTip[];
  return (data || []) as WeeklyTip[];
};

const cachedActiveWeeklyTips = unstable_cache(
  fetchActiveWeeklyTips,
  ["weekly-tips"],
  {
    revalidate: 300,
    tags: ["weekly-tips"],
  },
);

export function weeklyTipPeriod(now = Date.now()) {
  return Math.floor(Math.max(0, now - WEEKLY_TIP_EPOCH) / ROTATION_MS);
}

export async function getFeaturedWeeklyTip(now = Date.now()) {
  const tips = await cachedActiveWeeklyTips();
  if (!tips.length) return null;
  return tips[weeklyTipPeriod(now) % tips.length];
}

export function localWeeklyTip(tip: WeeklyTip, locale: Locale) {
  return locale === "ar"
    ? {
        title: tip.title_ar || tip.title_he,
        description: tip.description_ar || tip.description_he,
      }
    : { title: tip.title_he, description: tip.description_he };
}
