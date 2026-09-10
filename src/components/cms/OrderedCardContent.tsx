// @ts-nocheck -- blocks are normalized before public rendering.
"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { SiteItem } from "@/lib/cms-shared";
import { normalizeItemToEditorBlocks, type EditorBlock } from "./VisualCardEditor";

/** Public renderer for persisted block order; legacy cards retain their old renderer. */
export function OrderedCardContent({ item, locale }: { item: SiteItem; locale: Locale }) {
  const stored = item.settings?.contentBlocks;
  if (!Array.isArray(stored) || !stored.length) return null;
  const blocks = normalizeItemToEditorBlocks(item);
  return <div className="ordered-card-content">{blocks.map((block: EditorBlock) => {
    if (block.type === "image") return block.media.url ? <img key={block.id} className={`ordered-media ordered-media-${block.media.width || "medium"}`} src={block.media.url} alt="" style={{ objectFit: block.media.fit || "cover", marginInlineStart: block.media.align === "end" ? "auto" : block.media.align === "center" ? "auto" : undefined, marginInlineEnd: block.media.align === "start" ? "auto" : block.media.align === "center" ? "auto" : undefined }} /> : null;
    if (block.type === "pdf") return block.media.url ? <a key={block.id} className="ordered-pdf" href={block.media.url} target="_blank" rel="noreferrer"><FileText size={22}/>{block.media.displayName || (locale === "he" ? "צפייה במסמך" : "عرض المستند")}</a> : null;
    if (block.type === "button") return block[locale] && block.href ? <Link key={block.id} className="button" href={block.href}>{block[locale]}</Link> : null;
    const style = block.style || {};
    const classes = `content-block text-${style.size || "normal"} align-${style.align || "start"} space-${style.spacing || "normal"} ${style.bold ? "is-bold" : ""} ${style.underline ? "is-underlined" : ""}`;
    return block[locale] ? <div key={block.id} className={classes}>{block.type === "subheading" ? <h3>{block[locale]}</h3> : block.type === "source" ? <small>{block[locale]}</small> : <p>{block[locale]}</p>}</div> : null;
  })}</div>;
}
