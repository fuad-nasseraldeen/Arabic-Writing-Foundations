import type { Locale } from "@/i18n/config";
import type { SiteItem } from "@/lib/cms-shared";

export type TextBlockStyle = {
  align?: "start" | "center" | "end";
  size?: "small" | "normal" | "large" | "heading";
  spacing?: "tight" | "normal" | "loose";
  bold?: boolean;
  underline?: boolean;
};

export type TextContentBlock = {
  id: string;
  type: "paragraph" | "subheading" | "source";
  he: string;
  ar: string;
  style?: TextBlockStyle;
};
export type MediaContentBlock = {
  id: string;
  type: "image" | "pdf";
  media: {
    url: string;
    name?: string;
    mime?: string;
    displayName?: string;
    width?: "small" | "medium" | "large" | "full";
    fit?: "cover" | "contain";
    align?: "start" | "center" | "end";
    tone?: "none" | "white" | "mist" | "warm" | "soft";
    documentStyle?: "clean" | "bordered";
    bold?: boolean;
  };
};
export type ButtonContentBlock = {
  id: string;
  type: "button";
  he: string;
  ar: string;
  href: string;
};
export type ContentBlock = TextContentBlock | MediaContentBlock | ButtonContentBlock;
export type CardStyle = {
  align?: "start" | "center" | "end";
  background?: "default" | "soft" | "accent";
  border?: "default" | "soft" | "none";
  density?: "compact" | "normal" | "relaxed";
  childCount?: ChildCountStyle;
};
export type ChildCountStyle = {
  visible?: boolean;
  position?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
  border?: boolean;
  variant?: "subtle" | "emphasized";
};
export type ResolvedCardStyle = Omit<Required<CardStyle>, "childCount"> & {
  childCount: Required<ChildCountStyle>;
};

export const DEFAULT_CARD_STYLE: ResolvedCardStyle = {
  align: "center",
  background: "default",
  border: "soft",
  density: "normal",
  childCount: { visible: true, position: "bottom-start", border: false, variant: "subtle" },
};

export const DEFAULT_BLOCK_STYLES = {
  paragraph: { size: "normal", spacing: "normal" },
  subheading: { size: "large", spacing: "normal", bold: true },
  source: { size: "small", spacing: "normal" },
  image: { width: "full", fit: "cover", align: "center" },
  pdf: { tone: "none", align: "center", documentStyle: "clean" },
} as const;

const id = () => crypto.randomUUID();
const has = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isContentBlock = (value: unknown): value is ContentBlock => {
  if (!has(value) || typeof value.id !== "string" || typeof value.type !== "string")
    return false;
  if (["paragraph", "subheading", "source"].includes(value.type))
    return typeof value.he === "string" && typeof value.ar === "string";
  if (value.type === "button")
    return (
      typeof value.he === "string" &&
      typeof value.ar === "string" &&
      typeof value.href === "string"
    );
  return (
    (value.type === "image" || value.type === "pdf") &&
    has(value.media) &&
    typeof value.media.url === "string"
  );
};

/**
 * A saved, non-empty ordered block list owns public card composition.
 * Legacy columns are a read-only fallback for cards created before blocks.
 */
export function hasStoredContentBlocks(item?: SiteItem | null): boolean {
  const stored = item?.settings?.contentBlocks;
  return Array.isArray(stored) && stored.length > 0 && stored.every(isContentBlock);
}

export function normalizeItemToContentBlocks(item?: SiteItem | null): ContentBlock[] {
  const stored = item?.settings?.contentBlocks;
  if (hasStoredContentBlocks(item)) return stored as ContentBlock[];
  if (!item) return [];
  const blocks: ContentBlock[] = [];
  if (item.description_he || item.description_ar)
    blocks.push({ id: id(), type: "paragraph", he: item.description_he || "", ar: item.description_ar || "" });
  if (item.image_url)
    blocks.push({ id: id(), type: "image", media: { url: item.image_url, name: item.original_file_name || "", mime: item.media_mime_type || "" } });
  if (item.file_url)
    blocks.push({ id: id(), type: "pdf", media: { url: item.file_url, name: item.original_file_name || "" } });
  if (item.cta_label_he || item.cta_label_ar || item.cta_href)
    blocks.push({ id: id(), type: "button", he: item.cta_label_he || "", ar: item.cta_label_ar || "", href: item.cta_href || "" });
  return blocks;
}

export function resolveCardStyle(value: unknown): ResolvedCardStyle {
  const style = has(value) ? value : {};
  const childCount = has(style.childCount) ? style.childCount : {};
  const savedPosition = String(childCount.position);
  const childPosition = savedPosition === "top" || savedPosition === "start"
    ? "top-start"
    : savedPosition === "end"
      ? "top-end"
      : savedPosition === "bottom"
        ? "bottom-start"
        : ["top-start", "top-end", "bottom-start", "bottom-end"].includes(savedPosition)
          ? savedPosition as Required<ChildCountStyle>["position"]
          : DEFAULT_CARD_STYLE.childCount.position;
  return {
    align: ["start", "center", "end"].includes(String(style.align)) ? style.align as ResolvedCardStyle["align"] : DEFAULT_CARD_STYLE.align,
    background: ["default", "soft", "accent"].includes(String(style.background)) ? style.background as ResolvedCardStyle["background"] : DEFAULT_CARD_STYLE.background,
    border: ["default", "soft", "none"].includes(String(style.border)) ? style.border as ResolvedCardStyle["border"] : DEFAULT_CARD_STYLE.border,
    density: ["compact", "normal", "relaxed"].includes(String(style.density)) ? style.density as ResolvedCardStyle["density"] : DEFAULT_CARD_STYLE.density,
    childCount: {
      visible: typeof childCount.visible === "boolean" ? childCount.visible : DEFAULT_CARD_STYLE.childCount.visible,
      position: childPosition,
      border: typeof childCount.border === "boolean" ? childCount.border : DEFAULT_CARD_STYLE.childCount.border,
      variant: ["subtle", "emphasized"].includes(String(childCount.variant)) ? childCount.variant as Required<ChildCountStyle>["variant"] : DEFAULT_CARD_STYLE.childCount.variant,
    },
  };
}

export function normalizeSiteItemForRendering(item: SiteItem) {
  return {
    title: { he: item.title_he || "", ar: item.title_ar || "" },
    titleStyle: (has(item.settings?.titleStyle) ? item.settings.titleStyle : {}) as TextBlockStyle,
    blocks: normalizeItemToContentBlocks(item),
    cardStyle: resolveCardStyle(item.settings?.cardStyle),
  };
}

export function resolveTextBlockStyle(
  block: TextContentBlock,
  cardStyle: ResolvedCardStyle,
) {
  const defaults = DEFAULT_BLOCK_STYLES[block.type];
  return {
    align: block.style?.align ?? cardStyle.align,
    size: block.style?.size ?? defaults.size,
    spacing: block.style?.spacing ?? defaults.spacing,
    bold: block.style?.bold ?? ("bold" in defaults ? Boolean(defaults.bold) : false),
    underline: Boolean(block.style?.underline),
  };
}

export function resolveTitleStyle(style: TextBlockStyle | undefined, cardStyle: ResolvedCardStyle) {
  return {
    align: style?.align ?? cardStyle.align,
    size: style?.size ?? "heading",
    spacing: style?.spacing ?? "normal",
    bold: style?.bold ?? false,
    underline: style?.underline ?? false,
  } as Required<TextBlockStyle>;
}

export function resolveDocumentStyle(block: MediaContentBlock) {
  return block.media.documentStyle ?? DEFAULT_BLOCK_STYLES.pdf.documentStyle;
}

export const localized = (block: TextContentBlock | ButtonContentBlock, locale: Locale) =>
  block[locale] || "";
