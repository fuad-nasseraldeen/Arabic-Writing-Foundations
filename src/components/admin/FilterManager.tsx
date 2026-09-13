"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { FilterGroup } from "@/lib/worksheet-types";
import { deleteFilterOption, saveFilterGroup, saveFilterOption } from "@/app/[locale]/admin/actions";

type GroupWithUsage = FilterGroup & { usage: Record<string, number> };
const copy = (locale: Locale, he: string, ar: string) => locale === "he" ? he : ar;

function FilterSubmitButton({ className, label, savingLabel, formAction }: { className: string; label: string; savingLabel: string; formAction?: (formData: FormData) => void | Promise<void> }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-busy={pending} formAction={formAction}>{pending ? <><LoaderCircle className="theme-spinner" size={15} aria-hidden="true" />{savingLabel}</> : label}</button>;
}

export function FilterManager({ locale, groups }: { locale: Locale; groups: GroupWithUsage[] }) {
  const [errorId, setErrorId] = useState<string | null>(null);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const savingText = copy(locale, "שומר…", "جارٍ الحفظ…");
  const failedText = copy(locale, "השמירה נכשלה. נסו שוב.", "فشل الحفظ. حاولوا مجدداً.");
  const submit = async (action: (locale: string, formData: FormData) => Promise<void>, data: FormData, id: string) => {
    setErrorId(null);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    const startedAt = performance.now();
    try {
      await action(locale, data);
      const remaining = 550 - (performance.now() - startedAt);
      if (remaining > 0) await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
    } catch {
      setErrorId(id);
    }
  };
  const status = (id: string) => errorId === id ? <span className="filter-manager-feedback is-error" role="alert">{failedText}</span> : null;
  return <div className="filter-manager">
    {groups.map((group) => {
      const isOpen = openGroupId === group.id;
      const contentId = `filter-group-${group.id}`;
      return <section className={"filter-manager-group" + (isOpen ? " is-open" : "")} key={group.id}>
      <button type="button" className={"filter-manager-group-summary" + (group.is_visible ? "" : " is-hidden")} aria-expanded={isOpen} aria-controls={contentId} onClick={() => setOpenGroupId((current) => current === group.id ? null : group.id)}>
        <span className="filter-manager-group-summary-title">{copy(locale, group.label_he, group.label_ar)}</span>
        <span className="filter-manager-group-summary-meta">{group.key} · {copy(locale, `${group.options.length} אפשרויות`, `${group.options.length} خيارات`)}</span>
        {!group.is_visible && <span className="filter-manager-group-visibility">{copy(locale, "לא מוצג", "غير ظاهر")}</span>}
      </button>
      <div id={contentId} className="filter-manager-group-collapse" aria-hidden={!isOpen} inert={!isOpen}>
      <div className="filter-manager-group-body">
      <form action={(data) => submit(saveFilterGroup, data, `group:${group.id}`)} className="filter-manager-group-head">
        <input type="hidden" name="id" value={group.id} />
        <label>{copy(locale, "מפתח", "المفتاح")}<input name="key" defaultValue={group.key} required /></label>
        <label>{copy(locale, "שם בעברית", "الاسم بالعبرية")}<input name="label_he" defaultValue={group.label_he} required /></label>
        <label>{copy(locale, "שם בערבית", "الاسم بالعربية")}<input name="label_ar" defaultValue={group.label_ar} required /></label>
        <label>{copy(locale, "בחירה", "الاختيار")}<select name="selection_mode" defaultValue={group.selection_mode}><option value="multi">{copy(locale, "רב־בחירה", "متعدد")}</option><option value="single">{copy(locale, "בחירה יחידה", "واحد")}</option></select></label>
        <label>{copy(locale, "סדר", "الترتيب")}<input name="sort_order" type="number" defaultValue={group.sort_order} /></label>
        <label className="check"><input name="is_visible" type="checkbox" defaultChecked={group.is_visible} />{copy(locale, "מוצג", "ظاهر")}</label>
        <FilterSubmitButton className="outline-button" label={copy(locale, "שמור קבוצה", "حفظ المجموعة")} savingLabel={savingText} />{status(`group:${group.id}`)}
      </form>
      <div className="filter-manager-options">
        {group.options.map((option) => <form action={(data) => submit(saveFilterOption, data, `option:${option.id}`)} className="filter-manager-option" key={option.id}>
          <input type="hidden" name="id" value={option.id} /><input type="hidden" name="group_id" value={group.id} />
          <label>{copy(locale, "מפתח", "المفتاح")}<input name="key" defaultValue={option.key} required /></label>
          <label>{copy(locale, "עברית", "العبرية")}<input name="label_he" defaultValue={option.label_he} required /></label>
          <label>{copy(locale, "ערבית", "العربية")}<input name="label_ar" defaultValue={option.label_ar} required /></label>
          <label>{copy(locale, "סדר", "الترتيب")}<input name="sort_order" type="number" defaultValue={option.sort_order} /></label>
          <label className="check"><input name="is_visible" type="checkbox" defaultChecked={option.is_visible} />{copy(locale, "מוצג", "ظاهر")}</label>
          <span className="muted-note">{copy(locale, `בשימוש: ${group.usage[option.id] || 0}`, `قيد الاستخدام: ${group.usage[option.id] || 0}`)}</span>
          <FilterSubmitButton className="outline-button" label={copy(locale, "שמור", "حفظ")} savingLabel={savingText} />{status(`option:${option.id}`)}
          {(group.usage[option.id] || 0) === 0 && <FilterSubmitButton className="danger-button" label={copy(locale, "מחק", "حذف")} savingLabel={copy(locale, "מוחק…", "جارٍ الحذف…")} formAction={(data) => submit(deleteFilterOption, data, `option:${option.id}`)} />}
        </form>)}
      </div>
      <form action={(data) => submit(saveFilterOption, data, `new-option:${group.id}`)} className="filter-manager-option filter-manager-add">
        <input type="hidden" name="group_id" value={group.id} />
        <label>{copy(locale, "מפתח אפשרות", "مفتاح الخيار")}<input name="key" required /></label><label>{copy(locale, "עברית", "العبرية")}<input name="label_he" required /></label><label>{copy(locale, "ערבית", "العربية")}<input name="label_ar" required /></label><label>{copy(locale, "סדר", "الترتيب")}<input name="sort_order" type="number" defaultValue={group.options.length + 1} /></label><label className="check"><input name="is_visible" type="checkbox" defaultChecked />{copy(locale, "מוצג", "ظاهر")}</label><FilterSubmitButton className="button" label={copy(locale, "הוסף אפשרות", "إضافة خيار")} savingLabel={savingText} />{status(`new-option:${group.id}`)}
      </form>
      </div>
      </div>
    </section>})}
    <section className="filter-manager-group filter-manager-new"><h2>{copy(locale, "קבוצת פילטרים חדשה", "مجموعة مرشحات جديدة")}</h2><form action={(data) => submit(saveFilterGroup, data, "new-group")} className="filter-manager-group-head"><label>{copy(locale, "מפתח", "المفتاح")}<input name="key" required /></label><label>{copy(locale, "שם בעברית", "الاسم بالعبرية")}<input name="label_he" required /></label><label>{copy(locale, "שם בערבית", "الاسم بالعربية")}<input name="label_ar" required /></label><label>{copy(locale, "בחירה", "الاختيار")}<select name="selection_mode"><option value="multi">{copy(locale, "רב־בחירה", "متعدد")}</option><option value="single">{copy(locale, "בחירה יחידה", "واحد")}</option></select></label><label>{copy(locale, "סדר", "الترتيب")}<input name="sort_order" type="number" defaultValue={groups.length + 1} /></label><label className="check"><input name="is_visible" type="checkbox" defaultChecked />{copy(locale, "מוצג", "ظاهر")}</label><FilterSubmitButton className="button" label={copy(locale, "הוסף קבוצה", "إضافة مجموعة")} savingLabel={savingText} />{status("new-group")}</form></section>
  </div>;
}
