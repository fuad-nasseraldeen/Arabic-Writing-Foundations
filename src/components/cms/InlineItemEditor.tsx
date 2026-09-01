"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { SiteItem } from "@/lib/cms";
import { saveSiteItem, deleteSiteItem } from "@/app/[locale]/admin/actions";
import { InlineMediaUpload } from "./InlineMediaUpload";
import { EditorDrawer } from "./EditorDrawer";
import { useCmsEditMode } from "./CmsAdminProvider";

const routes = (locale: Locale) => [
  { value: `/${locale}`, he: "דף הבית", ar: "الصفحة الرئيسية" },
  { value: `/${locale}/letters`, he: "אותיות בקבוצות", ar: "الحروف ضمن مجموعات" },
  { value: `/${locale}/worksheets`, he: "דפי עבודה", ar: "أوراق عمل" },
  { value: `/${locale}/resources`, he: "חומרי העשרה", ar: "مواد إثرائية" },
  { value: `/${locale}/weekly-tip`, he: "טיפ השבוע", ar: "نصيحة الأسبوع" },
  { value: `/${locale}/project`, he: "על הפרויקט", ar: "عن المشروع" },
  { value: `/${locale}/about`, he: "אודותיי", ar: "من أنا" },
];

function SaveButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  return <button className="button save-button" disabled={pending}>{pending ? (locale === "he" ? "שומר…" : "جارٍ الحفظ…") : (locale === "he" ? "שמור" : "حفظ")}</button>;
}

function ButtonLinkFields({ locale, initialValue }: { locale: Locale; initialValue: string }) {
  const choices = routes(locale);
  const [selected, setSelected] = useState(choices.some((route) => route.value === initialValue) ? initialValue : "custom");
  const custom = selected === "custom";
  return <>
    <label>{locale === "he" ? "לאן הכפתור מוביל" : "إلى أين يؤدي الزر"}
      <select value={selected} onChange={(event) => setSelected(event.target.value)}>
        {choices.map((route) => <option key={route.value} value={route.value}>{locale === "he" ? route.he : route.ar}</option>)}
        <option value="custom">{locale === "he" ? "קישור מותאם אישית" : "رابط مخصص"}</option>
      </select>
    </label>
    {custom ? <label>{locale === "he" ? "קישור הכפתור" : "رابط الزر"}<input name="cta_href" defaultValue={initialValue} placeholder={locale === "he" ? "לדוגמה: /he/resources" : "مثال: /ar/resources"} /></label> : <input type="hidden" name="cta_href" value={selected} />}
  </>;
}

function ItemForm({ locale, item, sectionId, close, onSaved }: { locale: Locale; item?: SiteItem; sectionId: string; close: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<Locale>(locale);
  const [hasButton, setHasButton] = useState(Boolean(item?.cta_label_he || item?.cta_label_ar || item?.cta_href));
  const link = item?.cta_href || `/${locale}`;
  const submit = async (formData: FormData) => { await saveSiteItem(locale, formData); onSaved(); close(); };
  return <form className="cms-form" action={submit}>
    <input type="hidden" name="id" value={item?.id || ""} />
    <input type="hidden" name="section_id" value={sectionId} />
    <input type="hidden" name="item_type" value={item?.item_type || "feature_card"} />
    <div className="editor-tabs"><button type="button" className={tab === "he" ? "active" : ""} onClick={() => setTab("he")}>עברית</button><button type="button" className={tab === "ar" ? "active" : ""} onClick={() => setTab("ar")}>العربية</button></div>
    <label>{tab === "he" ? "כותרת" : "العنوان"}<input required={tab === "he"} name={`title_${tab}`} defaultValue={tab === "he" ? item?.title_he || "" : item?.title_ar || ""} /></label>
    <label>{tab === "he" ? "תיאור" : "الوصف"}<textarea name={`description_${tab}`} defaultValue={tab === "he" ? item?.description_he || "" : item?.description_ar || ""} /></label>
    <input type="hidden" name="has_button" value={hasButton ? "true" : "false"} />
    <label className="check"><input type="checkbox" checked={hasButton} onChange={(event) => setHasButton(event.target.checked)} />{tab === "he" ? "הצג כפתור בכרטיס" : "إظهار زر في البطاقة"}</label>
    {hasButton && <><label>{tab === "he" ? "טקסט הכפתור" : "نص الزر"}<input name={`cta_label_${tab}`} defaultValue={tab === "he" ? item?.cta_label_he || "" : item?.cta_label_ar || ""} /></label><ButtonLinkFields locale={locale} initialValue={link} /></>}
    <InlineMediaUpload locale={locale} initialUrl={item?.image_url || ""} />
    <label className="check"><input name="is_visible" type="checkbox" defaultChecked={item?.is_visible ?? true} />{tab === "he" ? "הכרטיס מוצג באתר" : "البطاقة ظاهرة في الموقع"}</label>
    <div className="drawer-actions"><button type="button" className="outline-button" onClick={close}>{tab === "he" ? "ביטול" : "إلغاء"}</button><SaveButton locale={tab} /></div>
  </form>;
}

function Toast({ visible, locale }: { visible: boolean; locale: Locale }) {
  return visible ? <div className="cms-toast" role="status">{locale === "he" ? "נשמר בהצלחה" : "تم الحفظ بنجاح"}</div> : null;
}

export function InlineItemEditor({ locale, item }: { locale: Locale; item: SiteItem }) {
  const editing = useCmsEditMode();
  const [open, setOpen] = useState(false), [confirm, setConfirm] = useState(false), [saved, setSaved] = useState(false);
  const showSaved = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2800); };
  if (!editing) return null;
  return <><div className="inline-card-controls" style={{ display: "flex" }}><button type="button" onClick={() => setOpen(true)} aria-label="עריכת כרטיס"><Pencil size={16} /></button><button type="button" onClick={() => setConfirm(true)} aria-label="מחיקת כרטיס"><Trash2 size={16} /></button></div><Toast visible={saved} locale={locale} />
    {confirm && <div className="confirm-popover"><p>{locale === "he" ? `למחוק את הכרטיס '${item.title_he || ""}'?` : "حذف البطاقة؟"}</p><button type="button" className="outline-button" onClick={() => setConfirm(false)}>{locale === "he" ? "ביטול" : "إلغاء"}</button><form action={async (fd) => { await deleteSiteItem(locale, fd); setConfirm(false); }}><input type="hidden" name="id" value={item.id} /><button className="danger-button">{locale === "he" ? "מחיקה" : "حذف"}</button></form></div>}
    {open && <EditorDrawer title={locale === "he" ? "עריכת כרטיס" : "تحرير البطاقة"} onClose={() => setOpen(false)}><ItemForm locale={locale} item={item} sectionId={item.section_id} close={() => setOpen(false)} onSaved={showSaved} /></EditorDrawer>}
  </>;
}

export function AddItemCard({ locale, sectionId, label }: { locale: Locale; sectionId: string; label: string }) {
  const editing = useCmsEditMode();
  const [open, setOpen] = useState(false), [saved, setSaved] = useState(false);
  if (!editing) return null;
  const showSaved = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2800); };
  return <><button className="add-cms-card" style={{ display: "grid" }} onClick={() => setOpen(true)}><Plus size={27} /><span>{label}</span></button><Toast visible={saved} locale={locale} />{open && <EditorDrawer title={label} onClose={() => setOpen(false)}><ItemForm locale={locale} sectionId={sectionId} close={() => setOpen(false)} onSaved={showSaved} /></EditorDrawer>}</>;
}
