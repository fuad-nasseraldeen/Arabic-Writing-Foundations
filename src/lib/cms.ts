import { unstable_cache } from "next/cache";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";
import {
  normalizeFontPreset,
  type FontPresetKey,
} from "@/components/cms/fontPresets";
import {
  defaultAccentPreset,
  isAccentPresetKey,
  type AccentPresetKey,
} from "@/components/cms/themePresets";
export { local, type ClickBehavior, type SiteItem } from "@/lib/cms-shared";
import type { SiteItem } from "@/lib/cms-shared";
export type Section = {
  id: string;
  key: string;
  page_key: string;
  section_type: string;
  title_he: string | null;
  title_ar: string | null;
  subtitle_he: string | null;
  subtitle_ar: string | null;
  settings: Record<string, string>;
  is_visible: boolean;
  sort_order: number;
};
const itemFields =
  "id,section_id,parent_id,item_type,title_he,title_ar,description_he,description_ar,show_button,click_behavior,cta_label_he,cta_label_ar,cta_href,image_url,file_url,media_title_he,media_title_ar,media_size,media_fit,media_position,original_file_name,media_mime_type,icon_key,variant,is_visible,sort_order,settings";
async function fetchPublishedPageCms(pageKey: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("site_sections")
    .select(
      "id,key,page_key,section_type,title_he,title_ar,subtitle_he,subtitle_ar,settings,is_visible,sort_order,site_items(" + itemFields + ")",
    )
    .eq("page_key", pageKey)
    .eq("status", "published")
    .eq("is_visible", true)
    .is("deleted_at", null)
    .eq("site_items.status", "published")
    .eq("site_items.is_visible", true)
    .is("site_items.deleted_at", null)
    .order("sort_order");
  const rows = (data ?? []) as unknown as Array<Section & { site_items?: SiteItem[] }>;
  return {
    sections: rows.map(({ site_items: _items, ...section }) => section),
    items: rows.flatMap((section) => section.site_items ?? []).sort((a, b) => a.sort_order - b.sort_order),
  };
}
const cachedPageCms = (pageKey: string) =>
  unstable_cache(() => fetchPublishedPageCms(pageKey), ["cms-page", pageKey], {
    revalidate: 300,
    tags: ["cms", `cms:${pageKey}`],
  })();
async function fetchAdminPageCms(pageKey: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_sections")
    .select(
      "id,key,page_key,section_type,title_he,title_ar,subtitle_he,subtitle_ar,settings,is_visible,sort_order,site_items(" + itemFields + ")",
    )
    .eq("page_key", pageKey)
    .is("deleted_at", null)
    .is("site_items.deleted_at", null)
    .order("sort_order");
  const rows = (data ?? []) as unknown as Array<Section & { site_items?: SiteItem[] }>;
  return {
    sections: rows.map(({ site_items: _items, ...section }) => section),
    items: rows.flatMap((section) => section.site_items ?? []).sort((a, b) => a.sort_order - b.sort_order),
  };
}
export async function getPageCms(pageKey: string, includeDraft = false) {
  return includeDraft ? fetchAdminPageCms(pageKey) : cachedPageCms(pageKey);
}
export type DesignSettings = {
  themeKey: string;
  textScale: "compact" | "normal" | "large";
  fontPreset: FontPresetKey;
  accentPreset: AccentPresetKey;
};
const cachedDesignSettings = unstable_cache(
  async (): Promise<DesignSettings> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("theme_settings")
      .select("theme_key,tokens")
      .eq("is_active", true)
      .maybeSingle();
    const tokens = (data?.tokens || {}) as Record<string, unknown>;
    const textScale = ["compact", "normal", "large"].includes(
      String(tokens.textScale),
    )
      ? (String(tokens.textScale) as DesignSettings["textScale"])
      : "normal";
    const fontPreset = normalizeFontPreset(String(tokens.fontPreset));
    const savedAccentPreset = String(tokens.accentPreset);
    const accentPreset = isAccentPresetKey(savedAccentPreset)
      ? savedAccentPreset
      : defaultAccentPreset;
    return {
      themeKey: data?.theme_key || "original",
      textScale,
      fontPreset,
      accentPreset,
    };
  },
  ["active-design-settings"],
  { revalidate: 300, tags: ["theme"] },
);
export async function getDesignSettings() {
  return cachedDesignSettings();
}
export async function getActiveTheme() {
  return (await getDesignSettings()).themeKey;
}
