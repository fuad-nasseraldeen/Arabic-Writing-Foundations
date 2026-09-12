import type { Locale } from "@/i18n/config";

const legacyPublicRoots = new Set([
  "letters",
  "worksheets",
  "resources",
  "weekly-tip",
  "project",
  "about",
  "skills",
  "strategies",
]);

/**
 * Converts only known legacy public CMS destinations to the locale-aware
 * route. Stored CMS data is never changed; external and already-localized
 * destinations pass through untouched.
 */
export function resolveInternalHref(href: string, locale: Locale): string {
  const value = href.trim();
  if (!value || value.startsWith("#") || /^(?:https?:|mailto:|tel:|\/\/)/i.test(value))
    return value;

  const match = value.match(/^([^?#]*)([?#][\s\S]*)?$/);
  const pathname = match?.[1] || value;
  const suffix = match?.[2] || "";
  if (pathname === "/") return `/${locale}${suffix}`;
  if (!pathname.startsWith("/")) return value;

  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "he" || segments[0] === "ar") return value;
  if (segments[0] && legacyPublicRoots.has(segments[0]))
    return `/${locale}/${segments.join("/")}${suffix}`;
  return value;
}

export const isInternalHref = (href: string) => href.startsWith("/") || href.startsWith("#");

export type ClickBehavior = "content" | "link" | "media" | "children";
export type SiteItem = { id:string; section_id:string; parent_id:string|null; item_type:string; title_he:string|null; title_ar:string|null; description_he:string|null; description_ar:string|null; show_button:boolean; click_behavior:ClickBehavior|null; cta_label_he:string|null; cta_label_ar:string|null; cta_href:string|null; image_url:string|null; file_url:string|null; media_title_he:string|null; media_title_ar:string|null; media_size:"small"|"medium"|"large"; media_fit:"cover"|"contain"; media_position:"top"|"bottom"; original_file_name:string|null; media_mime_type:string|null; icon_key:string|null; variant:string|null; is_visible:boolean; sort_order:number; settings:Record<string,unknown> };
export const local = (row:{[key:string]:unknown},field:string,locale:Locale) => String(row[`${field}_${locale}`] || row[`${field}_he`] || "");
