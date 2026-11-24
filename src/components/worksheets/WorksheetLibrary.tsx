"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { FilterGroup, FilterOption, Worksheet, WorksheetLibraryData } from "@/lib/worksheet-types";
import { localized } from "@/lib/worksheet-types";
import { deleteWorksheet, saveWorksheet } from "@/app/[locale]/admin/actions";
import { EditorDrawer } from "@/components/cms/EditorDrawer";
import { PageHomeNavigation } from "@/components/navigation/PageHomeNavigation";
import { useCmsAdmin, useCmsEditMode } from "@/components/cms/CmsAdminProvider";
import { WorksheetMediaUpload } from "./WorksheetMediaUpload";
import { PageIntro } from "@/components/layout/PageIntro";
import { DocumentPreview } from "./DocumentPreview";
import styles from "./WorksheetLibrary.module.css";

const text = (locale: Locale, he: string, ar: string) => locale === "he" ? he : ar;
const label = (row: FilterGroup | FilterOption, locale: Locale) => localized(row, "label", locale);
function WorksheetEditor({ locale, data, worksheet, close }: { locale: Locale; data: WorksheetLibraryData; worksheet?: Worksheet; close: () => void }) {
  const [tab, setTab] = useState<Locale>(locale); const [saving, setSaving] = useState(false);
  const [translations, setTranslations] = useState({ title_he: worksheet?.title_he || "", title_ar: worksheet?.title_ar || "", description_he: worksheet?.description_he || "", description_ar: worksheet?.description_ar || "", therapeutic_goal_he: worksheet?.therapeutic_goal_he || "", therapeutic_goal_ar: worksheet?.therapeutic_goal_ar || "" });
  const selected = new Set(worksheet ? data.worksheetOptionIds[worksheet.id] || [] : []);
  const submit = async (formData: FormData) => { setSaving(true); try { await saveWorksheet(locale, formData); close(); } finally { setSaving(false); } };
  return <EditorDrawer title={worksheet ? text(locale, "עריכת דף עבודה", "تحرير ورقة عمل") : text(locale, "הוספת דף עבודה", "إضافة ورقة عمل")} onClose={() => !saving && close()}><form className={styles.editor} action={submit}><input type="hidden" name="id" value={worksheet?.id || ""} />{Object.entries(translations).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}<div className="editor-tabs"><button type="button" className={tab === "he" ? "active" : ""} onClick={() => setTab("he")}>עברית</button><button type="button" className={tab === "ar" ? "active" : ""} onClick={() => setTab("ar")}>العربية</button></div><label>{text(tab, "כותרת", "العنوان")}<input required={tab === "he"} value={translations[`title_${tab}`]} onChange={(event) => setTranslations((current) => ({ ...current, [`title_${tab}`]: event.target.value }))} /></label><label>{text(tab, "תיאור קצר", "وصف مختصر")}<textarea value={translations[`description_${tab}`]} onChange={(event) => setTranslations((current) => ({ ...current, [`description_${tab}`]: event.target.value }))} /></label><label>{text(tab, "מטרה טיפולית", "الهدف العلاجي")}<textarea value={translations[`therapeutic_goal_${tab}`]} onChange={(event) => setTranslations((current) => ({ ...current, [`therapeutic_goal_${tab}`]: event.target.value }))} /></label><fieldset className={styles.tagField}><legend>{text(locale, "מאפיינים", "خصائص")}</legend>{data.filterGroups.filter((group) => group.key !== "letter-group" && group.key !== "stage").map((group) => <div className={styles.filterGroup} key={group.id}><b>{label(group, locale)}</b><div className={styles.tagChips}>{group.options.map((option) => <label key={option.id}><input type={group.selection_mode === "single" ? "radio" : "checkbox"} name={group.selection_mode === "single" ? `filter_option_ids:${group.id}` : "filter_option_ids"} value={option.id} defaultChecked={selected.has(option.id)} />{label(option, locale)}</label>)}</div></div>)}</fieldset><label>{text(locale, "קבוצת אותיות", "مجموعة الحروف")}<select name="letter_group_id" defaultValue={worksheet?.letter_group_id || ""}><option value="">—</option>{data.letterGroups.map((group) => <option key={group.id} value={group.id}>{localized(group, "title", locale)}</option>)}</select></label><label>{text(locale, "תמונה ממוזערת (אופציונלי)", "صورة مصغرة (اختيارية)")}<WorksheetMediaUpload locale={locale} name="thumbnail_url" initialUrl={worksheet?.thumbnail_url} /></label><label>{text(locale, "קובץ דף העבודה", "ملف ورقة العمل")}<WorksheetMediaUpload locale={locale} name="file_url" initialUrl={worksheet?.file_url} initialName={worksheet?.original_file_name} /></label><label className="check"><input name="is_visible" type="checkbox" defaultChecked={worksheet?.is_visible ?? true} />{text(locale, "דף העבודה מוצג באתר", "ورقة العمل ظاهرة في الموقع")}</label><div className="drawer-actions"><button type="button" className="outline-button" disabled={saving} onClick={close}>{text(locale, "ביטול", "إلغاء")}</button><button className="button" disabled={saving}>{saving ? text(locale, "שומר…", "جارٍ الحفظ…") : text(locale, "שמור", "حفظ")}</button></div></form></EditorDrawer>;
}

type FilterPanelProps = {
  locale: Locale;
  groups: FilterGroup[];
  resultCount: number;
  selectedFor: (group: FilterGroup) => string;
  onOption: (group: FilterGroup, key: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
};

function FilterPanel({ locale, groups, resultCount, selectedFor, onOption, onClear, hasActiveFilters }: FilterPanelProps) {
  return (
    <section className={styles.filterPanel} aria-label={text(locale, "סינון דפי עבודה", "تصفية أوراق العمل")}>
      <div className={styles.discoveryFilters}>
        {groups.map((group) => (
          <label key={group.id}>
            {label(group, locale)}
            <select value={selectedFor(group)} onChange={(event) => onOption(group, event.target.value)}>
              <option value="">{group.key === "stage" ? text(locale, "כל השלבים", "كل المراحل") : text(locale, "כל הקבוצות", "كل المجموعات")}</option>
              {group.options.map((option) => <option key={option.id} value={option.key}>{label(option, locale)}</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className={styles.filterPanelFooter} role="status">
        <b>{locale === "he" ? `נמצאו ${resultCount} דפי עבודה` : `تم العثور على ${resultCount} أوراق عمل`}</b>
        {hasActiveFilters && <button type="button" onClick={onClear}>{text(locale, "נקה סינון", "مسح التصفية")}</button>}
      </div>
    </section>
  );
}

export function WorksheetLibrary({ locale, data }: { locale: Locale; data: WorksheetLibraryData; isAdmin: boolean }) {
  const { isAdmin } = useCmsAdmin(); const editing = useCmsEditMode(); const params = useSearchParams(); const pathname = usePathname();
  const [editor, setEditor] = useState<Worksheet | "new" | null>(null);
  const [preview, setPreview] = useState<Worksheet | null>(null);
  const [confirm, setConfirm] = useState<Worksheet | null>(null);
  const [deleteFile, setDeleteFile] = useState(true);
  const groups = useMemo(() => data.filterGroups.filter(({ key }) => key === "letter-group" || key === "stage"), [data.filterGroups]);
  const optionById = useMemo(() => new Map(groups.flatMap((group) => group.options).map((option) => [option.id, option])), [groups]);
  const setParams = (next: URLSearchParams) => {
    window.history.pushState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
  };
  const selectedFor = (group: FilterGroup) => params.get(group.key) || "";
  const setGroup = (group: FilterGroup, key: string) => {
    const next = new URLSearchParams(params.toString());
    if (key) next.set(group.key, key);
    else next.delete(group.key);
    setParams(next);
  };
  const filtered = useMemo(() => data.worksheets.filter((worksheet) => {
    if (locale === "ar" && (worksheet.sourceLocale === "he" || !worksheet.title_ar?.trim() || !worksheet.file_url)) return false;
    const ids = data.worksheetOptionIds[worksheet.id] || [];
    return groups.every((group) => {
      const key = params.get(group.key);
      return !key || group.options.some((option) => option.key === key && ids.includes(option.id));
    });
  }).sort((a, b) => {
    const sort = params.get("sort");
    if (sort === "oldest") return a.created_at.localeCompare(b.created_at);
    if (sort === "alpha") return localized(a, "title", locale).localeCompare(localized(b, "title", locale), locale);
    return b.created_at.localeCompare(a.created_at);
  }), [data, groups, params, locale]);
  const clearFilters = () => {
    const next = new URLSearchParams(params.toString());
    groups.forEach(({ key }) => next.delete(key));
    setParams(next);
  };
  const hasActiveFilters = groups.some((group) => Boolean(selectedFor(group)));
  const deleteCurrent = async () => { if (!confirm) return; const form = new FormData(); form.set("id", confirm.id); if (deleteFile) form.set("delete_file", "on"); await deleteWorksheet(locale, form); setConfirm(null); };
  return (
    <div className={`page-shell container ${styles.library}`}>
      <PageHomeNavigation locale={locale} />
      <PageIntro eyebrow={text(locale, "ספריית תרגול", "مكتبة التدريب")} title={text(locale, "דפי עבודה", "أوراق عمل")} description={text(locale, "מצאו דף תרגול לפי קבוצת אותיות ושלב.", "اعثروا على ورقة تدريب حسب مجموعة الحروف والمرحلة.")} />
      <FilterPanel locale={locale} groups={groups} resultCount={filtered.length} selectedFor={selectedFor} onOption={setGroup} onClear={clearFilters} hasActiveFilters={hasActiveFilters} />
      <div className={styles.resultBar}><select value={params.get("sort") || "newest"} onChange={(event) => { const next = new URLSearchParams(params.toString()); next.set("sort", event.target.value); setParams(next); }}><option value="newest">{text(locale, "החדשים ביותר", "الأحدث")}</option><option value="oldest">{text(locale, "הישנים ביותר", "الأقدم")}</option><option value="alpha">{text(locale, "א-ב", "أ-ي")}</option></select></div>
      <div className={styles.grid} style={{ "--desktop-columns": data.columns } as CSSProperties}>
        {filtered.map((worksheet) => {
          const labels = (data.worksheetOptionIds[worksheet.id] || []).map((id) => optionById.get(id)).filter(Boolean).map((option) => label(option!, locale));
          const previewLabel = text(locale, "צפייה בדף העבודה", "عرض ورقة العمل");
          return <article className={`${styles.card} cms-editable-card`} key={worksheet.id}>{editing && isAdmin && !worksheet.bundled && <div className="inline-card-controls" style={{ display: "flex" }}><button type="button" onClick={() => setEditor(worksheet)} aria-label={text(locale, "עריכת דף עבודה", "تحرير ورقة عمل")}><Pencil size={16} /></button><button type="button" onClick={() => { setDeleteFile(true); setConfirm(worksheet); }} aria-label={text(locale, "מחיקת דף עבודה", "حذف ورقة عمل")}><Trash2 size={16} /></button></div>}
            <button type="button" className={styles.preview} onClick={() => setPreview(worksheet)} aria-label={previewLabel}>
              {worksheet.thumbnail_url || (worksheet.file_type === "image" && worksheet.file_url)
                  ? <img src={worksheet.thumbnail_url || worksheet.file_url || undefined} alt="" loading="lazy" />
                  : <><FileText size={40} /><span>PDF</span></>}
            </button>
            <div className={styles.badges}>{labels.map((value) => <span className={styles.badge} key={value}>{value}</span>)}</div><h2>{localized(worksheet, "title", locale)}</h2><p>{localized(worksheet, "description", locale)}</p>
            <button type="button" className="card-link" onClick={() => setPreview(worksheet)}>{previewLabel}</button>
          </article>;
        })}
        {editing && isAdmin && <button className="add-cms-card" onClick={() => setEditor("new")}><Plus size={27} /><span>{text(locale, "הוסף דף עבודה", "إضافة ورقة عمل")}</span></button>}</div>
      {!filtered.length && <div className={styles.empty}><b>{text(locale, "לא נמצאו דפי עבודה לפי הסינון שנבחר.", "لا توجد أوراق عمل بحسب التصفية المختارة.")}</b><button type="button" className="card-link" onClick={clearFilters}>{text(locale, "נקה פילטרים", "مسح المرشحات")}</button></div>}
      {editor && <WorksheetEditor locale={locale} data={data} worksheet={editor === "new" ? undefined : editor} close={() => setEditor(null)} />}
      {preview?.file_url && <DocumentPreview locale={locale} title={localized(preview, "title", locale)} url={preview.file_url} pdf={preview.file_type === "pdf"} onClose={() => setPreview(null)} />}
      {confirm && <div className={styles.confirm} role="dialog"><p>{locale === "he" ? `למחוק את "${confirm.title_he}"?` : "حذف ورقة العمل؟"}</p><label className="check"><input type="checkbox" checked={deleteFile} onChange={(event) => setDeleteFile(event.target.checked)} />{text(locale, "מחיקת הקובץ מהאחסון אם אינו בשימוש במקום אחר", "حذف الملف من التخزين إذا لم يكن مستخدماً في مكان آخر")}</label><button className="outline-button" onClick={() => setConfirm(null)}>{text(locale, "ביטול", "إلغاء")}</button><button className="danger-button" onClick={deleteCurrent}>{text(locale, "מחיקה", "حذف")}</button></div>}
    </div>
  );
}
