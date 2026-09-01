"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, ChevronDown, ChevronUp } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Section } from "@/lib/cms";
import { saveSection, moveSection } from "@/app/[locale]/admin/actions";
import { EditorDrawer } from "./EditorDrawer";
import { useCmsEditMode } from "./CmsAdminProvider";

function SaveButton({ locale }: { locale: Locale }) { const { pending } = useFormStatus(); return <button className="button save-button" disabled={pending}>{pending ? (locale === "he" ? "שומר…" : "جارٍ الحفظ…") : (locale === "he" ? "שמור" : "حفظ")}</button>; }

export function InlineSectionEditor({ locale, section }: { locale: Locale; section: Section }) {
  const editing = useCmsEditMode();
  const [open, setOpen] = useState(false), [tab, setTab] = useState<Locale>(locale);
  const hasButton = Boolean(section.settings.cta_href || section.settings.cta_label_he || section.settings.cta_label_ar);
  if (!editing) return null;
  const submit = async (formData: FormData) => { await saveSection(locale, formData); setOpen(false); };
  return <>
    <div className="inline-controls" style={{ display: "flex" }}><button type="button" onClick={() => setOpen(true)} aria-label="עריכת אזור"><Pencil size={15} /></button><form action={moveSection.bind(null, locale)}><input name="id" type="hidden" value={section.id} /><input name="direction" type="hidden" value="up" /><button aria-label="הזזת אזור למעלה"><ChevronUp size={15} /></button></form><form action={moveSection.bind(null, locale)}><input name="id" type="hidden" value={section.id} /><input name="direction" type="hidden" value="down" /><button aria-label="הזזת אזור למטה"><ChevronDown size={15} /></button></form></div>
    {open && <EditorDrawer title={locale === "he" ? "עריכת אזור" : "تحرير القسم"} onClose={() => setOpen(false)}><form action={submit} className="cms-form"><input name="id" type="hidden" value={section.id} /><div className="editor-tabs"><button type="button" className={tab === "he" ? "active" : ""} onClick={() => setTab("he")}>עברית</button><button type="button" className={tab === "ar" ? "active" : ""} onClick={() => setTab("ar")}>العربية</button></div><label>{tab === "he" ? "כותרת" : "العنوان"}<input name={`title_${tab}`} defaultValue={tab === "he" ? section.title_he || "" : section.title_ar || ""} /></label><label>{tab === "he" ? "כותרת משנה" : "العنوان الفرعي"}<textarea name={`subtitle_${tab}`} defaultValue={tab === "he" ? section.subtitle_he || "" : section.subtitle_ar || ""} /></label>{hasButton && <><label>{tab === "he" ? "טקסט הכפתור" : "نص الزر"}<input name={`cta_label_${tab}`} defaultValue={String(section.settings[`cta_label_${tab}`] || "")} /></label><label>{tab === "he" ? "קישור הכפתור" : "رابط الزر"}<input name="cta_href" defaultValue={String(section.settings.cta_href || "")} placeholder={tab === "he" ? "לדוגמה: /he/resources" : "مثال: /ar/resources"} /></label></>}<label className="check"><input name="is_visible" type="checkbox" defaultChecked={section.is_visible} />{tab === "he" ? "האזור מוצג באתר" : "القسم ظاهر في الموقع"}</label><div className="drawer-actions"><button type="button" className="outline-button" onClick={() => setOpen(false)}>{tab === "he" ? "ביטול" : "إلغاء"}</button><SaveButton locale={tab} /></div></form></EditorDrawer>}
  </>;
}
