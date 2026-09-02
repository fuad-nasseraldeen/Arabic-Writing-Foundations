import type { Locale } from "@/i18n/config";

export type ClickBehavior = "content" | "link" | "media" | "children";
export type SiteItem = { id:string; section_id:string; parent_id:string|null; item_type:string; title_he:string|null; title_ar:string|null; description_he:string|null; description_ar:string|null; show_button:boolean; click_behavior:ClickBehavior|null; cta_label_he:string|null; cta_label_ar:string|null; cta_href:string|null; image_url:string|null; file_url:string|null; media_title_he:string|null; media_title_ar:string|null; media_size:"small"|"medium"|"large"; media_fit:"cover"|"contain"; media_position:"top"|"bottom"; original_file_name:string|null; media_mime_type:string|null; icon_key:string|null; variant:string|null; is_visible:boolean; sort_order:number; settings:Record<string,unknown> };
export const local = (row:{[key:string]:unknown},field:string,locale:Locale) => String(row[`${field}_${locale}`] || row[`${field}_he`] || "");
