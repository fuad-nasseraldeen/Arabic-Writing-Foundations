"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  FileText,
  ImageIcon,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type {
  Worksheet,
  WorksheetLibraryData,
  WorksheetSkill,
  WorksheetTag,
} from "@/lib/worksheet-types";
import { localized } from "@/lib/worksheet-types";
import { deleteWorksheet, saveWorksheet } from "@/app/[locale]/admin/actions";
import { EditorDrawer } from "@/components/cms/EditorDrawer";
import { WorksheetMediaUpload } from "./WorksheetMediaUpload";
import { useCmsEditMode } from "@/components/cms/CmsAdminProvider";
import styles from "./WorksheetLibrary.module.css";

const activities = [
  "tracing",
  "copying",
  "completion",
  "matching",
  "sorting",
  "independent-writing",
  "visual-discrimination",
  "multi-sensory",
  "other",
] as const;
const activityLabels: Record<string, { he: string; ar: string }> = {
  tracing: { he: "עקיבה", ar: "التتبع" },
  copying: { he: "העתקה", ar: "النسخ" },
  completion: { he: "השלמה", ar: "الإكمال" },
  matching: { he: "התאמה", ar: "المطابقة" },
  sorting: { he: "מיון", ar: "الفرز" },
  "independent-writing": { he: "כתיבה עצמאית", ar: "الكتابة المستقلة" },
  "visual-discrimination": { he: "הבחנה חזותית", ar: "التمييز البصري" },
  "multi-sensory": { he: "פעילות רב־חושית", ar: "نشاط متعدد الحواس" },
  other: { he: "אחר", ar: "أخرى" },
};
const difficultyLabels: Record<string, { he: string; ar: string }> = {
  easy: { he: "קל", ar: "سهل" },
  medium: { he: "בינוני", ar: "متوسط" },
  hard: { he: "קשה", ar: "صعب" },
};
const text = (locale: Locale, he: string, ar: string) =>
  locale === "he" ? he : ar;

function tagName(tag: WorksheetTag | undefined, locale: Locale) {
  return tag ? localized(tag, "name", locale) : "";
}
function skillName(skill: WorksheetSkill | undefined, locale: Locale) {
  return skill ? localized(skill, "name", locale) : "";
}

function Viewer({
  worksheet,
  locale,
  data,
  onClose,
}: {
  worksheet: Worksheet;
  locale: Locale;
  data: WorksheetLibraryData;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", escape);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", escape);
      document.body.style.overflow = original;
    };
  }, [onClose]);
  if (!mounted || !worksheet.file_url) return null;
  const title = localized(worksheet, "title", locale);
  const tags = (data.worksheetTags[worksheet.id] || [])
    .map((id) =>
      tagName(
        data.tags.find((tag) => tag.id === id),
        locale,
      ),
    )
    .filter(Boolean);
  return createPortal(
    <div className={styles.backdrop} onMouseDown={onClose}>
      <section
        className={styles.viewer}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <b>{title}</b>
          <div>
            <a
              href={worksheet.file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {text(locale, "פתח בטאב חדש", "فتح في علامة تبويب جديدة")}
              <ExternalLink size={16} />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label={text(locale, "סגירה", "إغلاق")}
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div
          style={{
            padding: "0 16px 14px",
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          {worksheet.description_he && (
            <p>{localized(worksheet, "description", locale)}</p>
          )}
          {worksheet.therapeutic_goal_he && (
            <p>
              <b>{text(locale, "מטרה טיפולית:", "الهدف العلاجي:")}</b>{" "}
              {localized(worksheet, "therapeutic_goal", locale)}
            </p>
          )}
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}
          >
            {[
              difficultyLabels[worksheet.difficulty][locale],
              worksheet.skill_id
                ? skillName(
                    data.skills.find(
                      (skill) => skill.id === worksheet.skill_id,
                    ),
                    locale,
                  )
                : "",
              activityLabels[worksheet.activity_type]?.[locale] ||
                activityLabels.other[locale],
              worksheet.age_group
                ? `${text(locale, "גיל ", "العمر ")}${worksheet.age_group === "all" ? text(locale, "כל הגילאים", "جميع الأعمار") : worksheet.age_group}`
                : "",
              ...tags,
            ]
              .filter(Boolean)
              .map((label) => (
                <span
                  key={label}
                  style={{
                    padding: "3px 7px",
                    borderRadius: 999,
                    background: "var(--ivory)",
                    color: "var(--ink)",
                    fontSize: 12,
                  }}
                >
                  {label}
                </span>
              ))}
          </div>
        </div>
        {worksheet.file_type === "pdf" ? (
          <iframe src={worksheet.file_url} title={title} />
        ) : (
          <img src={worksheet.file_url} alt={title} />
        )}
      </section>
    </div>,
    document.body,
  );
}

function WorksheetEditor({
  locale,
  data,
  worksheet,
  close,
}: {
  locale: Locale;
  data: WorksheetLibraryData;
  worksheet?: Worksheet;
  close: () => void;
}) {
  const [tab, setTab] = useState<Locale>(locale);
  const [saving, setSaving] = useState(false);
  const [translations, setTranslations] = useState({
    title_he: worksheet?.title_he || "",
    title_ar: worksheet?.title_ar || "",
    description_he: worksheet?.description_he || "",
    description_ar: worksheet?.description_ar || "",
    therapeutic_goal_he: worksheet?.therapeutic_goal_he || "",
    therapeutic_goal_ar: worksheet?.therapeutic_goal_ar || "",
  });
  const selectedTags = new Set(
    worksheet ? data.worksheetTags[worksheet.id] || [] : [],
  );
  const submit = async (formData: FormData) => {
    setSaving(true);
    try {
      await saveWorksheet(locale, formData);
      close();
    } finally {
      setSaving(false);
    }
  };
  return (
    <EditorDrawer
      title={
        worksheet
          ? text(locale, "עריכת דף עבודה", "تحرير ورقة عمل")
          : text(locale, "הוספת דף עבודה", "إضافة ورقة عمل")
      }
      onClose={() => !saving && close()}
    >
      <form className={styles.editor} action={submit}>
        <input type="hidden" name="id" value={worksheet?.id || ""} />
        {Object.entries(translations).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <div className="editor-tabs">
          <button
            type="button"
            className={tab === "he" ? "active" : ""}
            onClick={() => setTab("he")}
          >
            עברית
          </button>
          <button
            type="button"
            className={tab === "ar" ? "active" : ""}
            onClick={() => setTab("ar")}
          >
            العربية
          </button>
        </div>
        <label>
          {text(tab, "כותרת", "العنوان")}
          <input
            required={tab === "he"}
            value={translations[`title_${tab}`]}
            onChange={(event) =>
              setTranslations((current) => ({
                ...current,
                [`title_${tab}`]: event.target.value,
              }))
            }
          />
        </label>
        <label>
          {text(tab, "תיאור קצר", "وصف مختصر")}
          <textarea
            value={translations[`description_${tab}`]}
            onChange={(event) =>
              setTranslations((current) => ({
                ...current,
                [`description_${tab}`]: event.target.value,
              }))
            }
          />
        </label>
        <label>
          {text(tab, "מטרה טיפולית", "الهدف العلاجي")}
          <textarea
            value={translations[`therapeutic_goal_${tab}`]}
            onChange={(event) =>
              setTranslations((current) => ({
                ...current,
                [`therapeutic_goal_${tab}`]: event.target.value,
              }))
            }
          />
        </label>
        <div className={styles.fields}>
          <label>
            {text(locale, "רמת קושי", "مستوى الصعوبة")}
            <select
              name="difficulty"
              defaultValue={worksheet?.difficulty || "medium"}
            >
              {Object.entries(difficultyLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label[locale]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text(locale, "מיומנות", "المهارة")}
            <select name="skill_id" defaultValue={worksheet?.skill_id || ""}>
              <option value="">—</option>
              {data.skills.map((skill) => (
                <option value={skill.id} key={skill.id}>
                  {skillName(skill, locale)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text(locale, "סוג פעילות", "نوع النشاط")}
            <select
              name="activity_type"
              defaultValue={worksheet?.activity_type || "other"}
            >
              {activities.map((activity) => (
                <option key={activity} value={activity}>
                  {activityLabels[activity][locale]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text(locale, "גיל מומלץ", "العمر المقترح")}
            <select name="age_group" defaultValue={worksheet?.age_group || ""}>
              <option value="">—</option>
              <option value="4-5">4–5</option>
              <option value="5-6">5–6</option>
              <option value="6-7">6–7</option>
              <option value="all">
                {text(locale, "לכל הגילאים", "جميع الأعمار")}
              </option>
            </select>
          </label>
          <label>
            {text(locale, "קבוצת אותיות", "مجموعة الحروف")}
            <select
              name="letter_group_id"
              defaultValue={worksheet?.letter_group_id || ""}
            >
              <option value="">—</option>
              {data.letterGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {localized(group, "title", locale)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className={styles.tagField}>
          <legend>{text(locale, "תגיות", "الوسوم")}</legend>
          {data.tags.map((tag) => (
            <label key={tag.id}>
              <input
                type="checkbox"
                name="tag_ids"
                value={tag.id}
                defaultChecked={selectedTags.has(tag.id)}
              />
              {tagName(tag, locale)}
            </label>
          ))}
          <div className={styles.newTag}>
            <input name="new_tag_he" placeholder="תגית חדשה בעברית" />
            <input name="new_tag_ar" placeholder="وسم جديد بالعربية" />
          </div>
        </fieldset>
        <label>
          {text(locale, "תמונה ממוזערת (אופציונלי)", "صورة مصغرة (اختيارية)")}
          <WorksheetMediaUpload
            locale={locale}
            name="thumbnail_url"
            initialUrl={worksheet?.thumbnail_url}
          />
        </label>
        <label>
          {text(locale, "קובץ דף העבודה", "ملف ورقة العمل")}
          <WorksheetMediaUpload
            locale={locale}
            name="file_url"
            initialUrl={worksheet?.file_url}
            initialName={worksheet?.original_file_name}
          />
        </label>
        <label className="check">
          <input
            name="is_visible"
            type="checkbox"
            defaultChecked={worksheet?.is_visible ?? true}
          />
          {text(locale, "דף העבודה מוצג באתר", "ورقة العمل ظاهرة في الموقع")}
        </label>
        <div className="drawer-actions">
          <button
            type="button"
            className="outline-button"
            disabled={saving}
            onClick={close}
          >
            {text(locale, "ביטול", "إلغاء")}
          </button>
          <button className="button" disabled={saving}>
            {saving
              ? text(locale, "שומר…", "جارٍ الحفظ…")
              : text(locale, "שמור", "حفظ")}
          </button>
        </div>
      </form>
    </EditorDrawer>
  );
}

export function WorksheetLibrary({
  locale,
  data,
  isAdmin,
}: {
  locale: Locale;
  data: WorksheetLibraryData;
  isAdmin: boolean;
}) {
  const router = useRouter(),
    pathname = usePathname(),
    params = useSearchParams();
  const editing = useCmsEditMode();
  const [editor, setEditor] = useState<Worksheet | "new" | null>(null),
    [preview, setPreview] = useState<Worksheet | null>(null),
    [advanced, setAdvanced] = useState(false),
    [confirm, setConfirm] = useState<Worksheet | null>(null),
    [deleteFile, setDeleteFile] = useState(true);
  const [difficulty, setDifficulty] = useState(() => params.get("difficulty") || "");
  const [search, setSearch] = useState(() => params.get("q") || "");
  const get = (key: string) => params.get(key) || "";
  const setFilter = (key: string, value: string) => {
    if (key === "difficulty") setDifficulty(value);
    const next = new URLSearchParams(params.toString());
    value ? next.set(key, value) : next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  };
  const selectedTags = get("tags").split(",").filter(Boolean);
  const filtered = useMemo(
    () =>
      data.worksheets
        .filter((worksheet) => {
          const normalizedSearch = search.toLocaleLowerCase();
          const tags = data.worksheetTags[worksheet.id] || [];
          const tagText = tags
            .map((id) =>
              tagName(
                data.tags.find((tag) => tag.id === id),
                locale,
              ),
            )
            .join(" ")
            .toLowerCase();
          const haystack = [
            worksheet.title_he,
            worksheet.title_ar,
            worksheet.description_he,
            worksheet.description_ar,
            worksheet.therapeutic_goal_he,
            worksheet.therapeutic_goal_ar,
            tagText,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (normalizedSearch && !haystack.includes(normalizedSearch)) return false;
          if (difficulty && worksheet.difficulty !== difficulty)
            return false;
          if (get("skill") && worksheet.skill_id !== get("skill")) return false;
          if (get("activity") && worksheet.activity_type !== get("activity"))
            return false;
          if (get("age") && worksheet.age_group !== get("age")) return false;
          if (get("letter") && worksheet.letter_group_id !== get("letter"))
            return false;
          if (
            selectedTags.length &&
            !selectedTags.some((id) => tags.includes(id))
          )
            return false;
          return true;
        })
        .sort((a, b) => {
          const sort = get("sort") || "newest";
          if (sort === "oldest")
            return a.created_at.localeCompare(b.created_at);
          if (sort === "difficulty")
            return a.difficulty.localeCompare(b.difficulty);
          if (sort === "alpha")
            return localized(a, "title", locale).localeCompare(
              localized(b, "title", locale),
              locale,
            );
          return b.created_at.localeCompare(a.created_at);
        }),
    [data, params, locale, difficulty, search],
  );
  const clear = () => {
    setDifficulty("");
    setSearch("");
    router.replace(pathname, { scroll: false });
  };
  const deleteCurrent = async () => {
    if (!confirm) return;
    const form = new FormData();
    form.set("id", confirm.id);
    if (deleteFile) form.set("delete_file", "on");
    await deleteWorksheet(locale, form);
    setConfirm(null);
  };
  return (
    <div className={`page-shell container ${styles.library}`}>
      <span className="eyebrow">
        {text(locale, "ספריית תרגול", "مكتبة التدريب")}
      </span>
      <h1>{text(locale, "דפי עבודה", "أوراق عمل")}</h1>
      <p className="lead">
        {text(
          locale,
          "מצאו במהירות דף תרגול לפי רמת קושי, מיומנות וסוג פעילות.",
          "اعثروا بسرعة على ورقة تدريب وفق مستوى الصعوبة والمهارة ونوع النشاط.",
        )}
      </p>
      <div className={styles.filters}>
        <label className={styles.search}>
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={text(
              locale,
              "חפשו דף עבודה...",
              "ابحثوا عن ورقة عمل...",
            )}
          />
        </label>
        <div className={styles.chips}>
          {[
            ["", text(locale, "הכול", "الكل")],
            ["easy", difficultyLabels.easy[locale]],
            ["medium", difficultyLabels.medium[locale]],
            ["hard", difficultyLabels.hard[locale]],
          ].map(([value, label]) => (
            <button
              type="button"
              className={difficulty === value ? styles.active : ""}
              key={value || "all"}
              onClick={() => setFilter("difficulty", value)}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          aria-label={text(locale, "מיומנות", "المهارة")}
          value={get("skill")}
          onChange={(event) => setFilter("skill", event.target.value)}
        >
          <option value="">
            {text(locale, "כל המיומנויות", "كل المهارات")}
          </option>
          {data.skills.map((skill) => (
            <option value={skill.id} key={skill.id}>
              {skillName(skill, locale)}
            </option>
          ))}
        </select>
        <select
          aria-label={text(locale, "סוג פעילות", "نوع النشاط")}
          value={get("activity")}
          onChange={(event) => setFilter("activity", event.target.value)}
        >
          <option value="">
            {text(locale, "כל סוגי הפעילות", "كل أنواع الأنشطة")}
          </option>
          {activities.map((activity) => (
            <option key={activity} value={activity}>
              {activityLabels[activity][locale]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="outline-button"
          onClick={() => setAdvanced(!advanced)}
        >
          <SlidersHorizontal size={16} />
          {text(locale, "פילטרים נוספים", "مرشحات إضافية")}
        </button>
      </div>
      {advanced && (
        <div className={styles.advanced}>
          <select
            value={get("age")}
            onChange={(event) => setFilter("age", event.target.value)}
          >
            <option value="">{text(locale, "כל הגילאים", "كل الأعمار")}</option>
            <option value="4-5">4–5</option>
            <option value="5-6">5–6</option>
            <option value="6-7">6–7</option>
            <option value="all">
              {text(locale, "לכל הגילאים", "جميع الأعمار")}
            </option>
          </select>
          <select
            value={get("letter")}
            onChange={(event) => setFilter("letter", event.target.value)}
          >
            <option value="">
              {text(locale, "כל קבוצות האותיות", "كل مجموعات الحروف")}
            </option>
            {data.letterGroups.map((group) => (
              <option value={group.id} key={group.id}>
                {localized(group, "title", locale)}
              </option>
            ))}
          </select>
          <div className={styles.tagChips}>
            {data.tags.map((tag) => {
              const selected = selectedTags.includes(tag.id);
              return (
                <button
                  type="button"
                  className={selected ? styles.active : ""}
                  key={tag.id}
                  onClick={() =>
                    setFilter(
                      "tags",
                      selectedTags
                        .filter((id) => id !== tag.id)
                        .concat(selected ? [] : [tag.id])
                        .join(","),
                    )
                  }
                >
                  {tagName(tag, locale)}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className={styles.resultBar}>
        <span>
          {locale === "he"
            ? `נמצאו ${filtered.length} דפי עבודה`
            : `تم العثور على ${filtered.length} أوراق عمل`}
        </span>
        <select
          value={get("sort") || "newest"}
          onChange={(event) => setFilter("sort", event.target.value)}
        >
          <option value="newest">
            {text(locale, "החדשים ביותר", "الأحدث")}
          </option>
          <option value="oldest">
            {text(locale, "הישנים ביותר", "الأقدم")}
          </option>
          <option value="difficulty">
            {text(locale, "רמת קושי", "مستوى الصعوبة")}
          </option>
          <option value="alpha">{text(locale, "א-ב", "أ-ي")}</option>
        </select>
        {(params.size > 0 || search) && (
          <button type="button" onClick={clear}>
            {text(locale, "נקה הכל", "مسح الكل")}
          </button>
        )}
      </div>
      <div
        className={styles.grid}
        style={{ "--desktop-columns": data.columns } as CSSProperties}
      >
        {filtered.map((worksheet) => (
          <article
            className={`${styles.card} cms-editable-card`}
            key={worksheet.id}
          >
            {editing && isAdmin && (
              <div className="inline-card-controls" style={{ display: "flex" }}>
                <button
                  type="button"
                  onClick={() => setEditor(worksheet)}
                  aria-label={text(locale, "עריכת דף עבודה", "تحرير ورقة عمل")}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteFile(true);
                    setConfirm(worksheet);
                  }}
                  aria-label={text(locale, "מחיקת דף עבודה", "حذف ورقة عمل")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            <button
              type="button"
              className={styles.preview}
              onClick={() => setPreview(worksheet)}
              aria-label={text(locale, "צפייה בדף העבודה", "عرض ورقة العمل")}
            >
              {worksheet.thumbnail_url ? (
                <img src={worksheet.thumbnail_url} alt="" loading="lazy" />
              ) : worksheet.file_type === "image" && worksheet.file_url ? (
                <img src={worksheet.file_url} alt="" loading="lazy" />
              ) : (
                <>
                  <FileText size={40} />
                  <span>PDF</span>
                </>
              )}
            </button>
            <div className={styles.badges}>
              <span
                className={`${styles.badge} ${styles[worksheet.difficulty]}`}
              >
                {difficultyLabels[worksheet.difficulty][locale]}
              </span>
              {worksheet.skill_id && (
                <span className={styles.badge}>
                  {skillName(
                    data.skills.find(
                      (skill) => skill.id === worksheet.skill_id,
                    ),
                    locale,
                  )}
                </span>
              )}
              <span className={styles.badge}>
                {activityLabels[worksheet.activity_type]?.[locale] ||
                  activityLabels.other[locale]}
              </span>
            </div>
            <h2>{localized(worksheet, "title", locale)}</h2>
            <p>{localized(worksheet, "description", locale)}</p>
            <button
              type="button"
              className="card-link"
              onClick={() => setPreview(worksheet)}
            >
              {text(locale, "צפייה בדף העבודה", "عرض ورقة العمل")}
            </button>
          </article>
        ))}
        {editing && isAdmin && (
          <button className="add-cms-card" onClick={() => setEditor("new")}>
            <Plus size={27} />
            <span>{text(locale, "הוסף דף עבודה", "إضافة ورقة عمل")}</span>
          </button>
        )}
      </div>
      {!filtered.length && (
        <div className={styles.empty}>
          <b>
            {text(
              locale,
              "לא נמצאו דפי עבודה המתאימים לסינון שבחרתם.",
              "لا توجد أوراق عمل تناسب التصفية المختارة.",
            )}
          </b>
          <button type="button" className="outline-button" onClick={clear}>
            {text(locale, "נקה פילטרים", "مسح المرشحات")}
          </button>
        </div>
      )}
      {editor && (
        <WorksheetEditor
          locale={locale}
          data={data}
          worksheet={editor === "new" ? undefined : editor}
          close={() => setEditor(null)}
        />
      )}{" "}
      {preview && (
        <Viewer
          worksheet={preview}
          locale={locale}
          data={data}
          onClose={() => setPreview(null)}
        />
      )}{" "}
      {confirm && (
        <div className={styles.confirm} role="dialog">
          <p>
            {locale === "he"
              ? `למחוק את "${confirm.title_he}"?`
              : "حذف ورقة العمل؟"}
          </p>
          <label className="check">
            <input
              type="checkbox"
              checked={deleteFile}
              onChange={(event) => setDeleteFile(event.target.checked)}
            />
            {text(
              locale,
              "מחיקת הקובץ מהאחסון אם אינו בשימוש במקום אחר",
              "حذف الملف من التخزين إذا لم يكن مستخدماً في مكان آخر",
            )}
          </label>
          <button className="outline-button" onClick={() => setConfirm(null)}>
            {text(locale, "ביטול", "إلغاء")}
          </button>
          <button className="danger-button" onClick={deleteCurrent}>
            {text(locale, "מחיקה", "حذف")}
          </button>
        </div>
      )}
    </div>
  );
}
