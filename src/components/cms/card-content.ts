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
export type CardPrimaryAction =
  | { type: "group" }
  | { type: "document"; url: string; label?: string }
  | { type: "link"; href: string }
  | { type: "none" };
export type CardStyle = {
  align?: "start" | "center" | "end";
  background?: "default" | "soft" | "accent";
  border?: "default" | "soft" | "none";
  density?: "compact" | "normal" | "relaxed";
  /** Legacy childCount presentation is read but intentionally not rendered. */
  childCount?: ChildCountStyle;
  showItemCount?: boolean;
};
export type ChildCountStyle = {
  visible?: boolean;
  position?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
};
export type ResolvedCardStyle = Omit<Required<CardStyle>, "childCount" | "showItemCount"> & {
  childCount: Required<ChildCountStyle>;
};

export const DEFAULT_CARD_STYLE: ResolvedCardStyle = {
  align: "center",
  background: "default",
  border: "soft",
  density: "normal",
  childCount: { visible: true, position: "bottom-end" },
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
  return Array.isArray(stored) && stored.every(isContentBlock);
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

/** Resolves exactly one public-card action, in priority order. */
export function resolveCardPrimaryAction(
  item: SiteItem,
  blocks: ContentBlock[],
  hasChildren: boolean,
): CardPrimaryAction {
  if (hasChildren || item.click_behavior === "children") return { type: "group" };
  const document = blocks.find(
    (block): block is MediaContentBlock => block.type === "pdf" && Boolean(block.media.url),
  );
  if (document) return { type: "document", url: document.media.url, label: document.media.displayName };
  const link = blocks.find(
    (block): block is ButtonContentBlock => block.type === "button" && Boolean(block.href),
  );
  if (link) return { type: "link", href: link.href };
  return { type: "none" };
}

export function resolveCardStyle(value: unknown): ResolvedCardStyle {
  const style = has(value) ? value : {};
  return {
    align: ["start", "center", "end"].includes(String(style.align)) ? style.align as ResolvedCardStyle["align"] : DEFAULT_CARD_STYLE.align,
    background: ["default", "soft", "accent"].includes(String(style.background)) ? style.background as ResolvedCardStyle["background"] : DEFAULT_CARD_STYLE.background,
    border: ["default", "soft", "none"].includes(String(style.border)) ? style.border as ResolvedCardStyle["border"] : DEFAULT_CARD_STYLE.border,
    density: ["compact", "normal", "relaxed"].includes(String(style.density)) ? style.density as ResolvedCardStyle["density"] : DEFAULT_CARD_STYLE.density,
    childCount: {
      // Only this boolean is part of the public footer model. Position, border,
      // variant, and style settings remain stored data but have no presentation role.
      visible: typeof style.showItemCount === "boolean" ? style.showItemCount : true,
      position: DEFAULT_CARD_STYLE.childCount.position,
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
