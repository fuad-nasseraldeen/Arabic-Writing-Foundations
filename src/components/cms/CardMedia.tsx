"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileText, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { SiteItem } from "@/lib/cms-shared";

export function CardMedia({ item, locale, position }: { item: SiteItem; locale: Locale; position: "top" | "bottom" }) {
  const url = item.file_url || item.image_url;
  const isPdf = Boolean(item.file_url || item.media_mime_type === "application/pdf" || item.image_url?.toLowerCase().includes(".pdf"));
  const [open, setOpen] = useState(false);
  if (!url || (item.media_position || "top") !== position) return null;
  const title = (locale === "ar" ? item.media_title_ar || item.media_title_he : item.media_title_he || item.media_title_ar) || item.original_file_name || (isPdf ? "PDF" : "Image");
  return <><button type="button" className={`card-media card-media-${item.media_size || "medium"} ${isPdf ? "pdf" : "image"}`} onClick={() => setOpen(true)} aria-label={title}>
    {isPdf ? <><FileText size={34} aria-hidden="true" /><span><small>PDF</small><b title={title}>{title}</b><em>{locale === "he" ? "צפייה במסמך" : "عرض المستند"}</em></span></> : <img src={url} alt={title} loading="lazy" style={{ objectFit: item.media_fit || "cover" }} />}
  </button>{open && <MediaViewer url={url} title={title} isPdf={isPdf} locale={locale} onClose={() => setOpen(false)} />}</>;
}

function MediaViewer({ url, title, isPdf, locale, onClose }: { url: string; title: string; isPdf: boolean; locale: Locale; onClose: () => void }) {
  useEffect(() => { const handle = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", handle); const original = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { window.removeEventListener("keydown", handle); document.body.style.overflow = original; }; }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(<div className="media-viewer-backdrop" onMouseDown={onClose}><section className={`media-viewer ${isPdf ? "pdf-viewer" : ""}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><header><b>{title}</b><div><a href={url} target="_blank" rel="noopener noreferrer">{locale === "he" ? "פתח בטאב חדש" : "فتح في علامة تبويب جديدة"}<ExternalLink size={16} /></a><button type="button" onClick={onClose} aria-label={locale === "he" ? "סגירה" : "إغلاق"}><X size={20} /></button></div></header>{isPdf ? <iframe src={url} title={title}><p>{locale === "he" ? "לא ניתן להציג את הקובץ כאן. " : "لا يمكن عرض الملف هنا. "}<a href={url} target="_blank" rel="noopener noreferrer">{locale === "he" ? "פתח את ה-PDF בטאב חדש" : "افتح ملف PDF في علامة تبويب جديدة"}</a></p></iframe> : <img src={url} alt={title} />}</section></div>, document.body);
}
