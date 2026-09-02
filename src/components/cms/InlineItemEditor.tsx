"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { local, type SiteItem } from "@/lib/cms-shared";
import { saveSiteItem, deleteSiteItem } from "@/app/[locale]/admin/actions";
import { InlineMediaUpload } from "./InlineMediaUpload";
import { EditorDrawer } from "./EditorDrawer";
import { useCmsEditMode } from "./CmsAdminProvider";
import { VisualCardEditor } from "./VisualCardEditor";

const routes = (locale: Locale) => [
  { value: `/${locale}`, he: "דף הבית", ar: "الصفحة الرئيسية" },
  {
    value: `/${locale}/letters`,
    he: "אותיות בקבוצות",
    ar: "الحروف ضمن مجموعات",
  },
  { value: `/${locale}/worksheets`, he: "דפי עבודה", ar: "أوراق عمل" },
  { value: `/${locale}/resources`, he: "חומרי העשרה", ar: "مواد إثرائية" },
  { value: `/${locale}/weekly-tip`, he: "טיפ השבוע", ar: "نصيحة الأسبوع" },
  { value: `/${locale}/project`, he: "על הפרויקט", ar: "عن المشروع" },
  { value: `/${locale}/about`, he: "אודותיי", ar: "من أنا" },
];

function SaveButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  return (
    <button className="button save-button" disabled={pending}>
      {pending
        ? locale === "he"
          ? "שומר…"
          : "جارٍ الحفظ…"
        : locale === "he"
          ? "שמור"
          : "حفظ"}
    </button>
  );
}

function ButtonLinkFields({
  locale,
  initialValue,
}: {
  locale: Locale;
  initialValue: string;
}) {
  const choices = routes(locale);
  const [selected, setSelected] = useState(
    choices.some((route) => route.value === initialValue)
      ? initialValue
      : "custom",
  );
  const custom = selected === "custom";
  return (
    <>
      <label>
        {locale === "he" ? "לאן הכפתור מוביל" : "إلى أين يؤدي الزر"}
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {choices.map((route) => (
            <option key={route.value} value={route.value}>
              {locale === "he" ? route.he : route.ar}
            </option>
          ))}
          <option value="custom">
            {locale === "he" ? "קישור מותאם אישית" : "رابط مخصص"}
          </option>
        </select>
      </label>
      {custom ? (
        <label>
          {locale === "he" ? "קישור הכפתור" : "رابط الزر"}
          <input
            name="cta_href"
            defaultValue={initialValue}
            placeholder={
              locale === "he" ? "לדוגמה: /he/resources" : "مثال: /ar/resources"
            }
          />
        </label>
      ) : (
        <input type="hidden" name="cta_href" value={selected} />
      )}
    </>
  );
}

function ItemForm({
  locale,
  item,
  sectionId,
  parentId,
  childItems = [],
  close,
  onSaved,
  portraitOnly = false,
}: {
  locale: Locale;
  item?: SiteItem;
  sectionId: string;
  parentId?: string | null;
  childItems?: SiteItem[];
  close: () => void;
  onSaved: () => void;
  portraitOnly?: boolean;
}) {
  const [tab, setTab] = useState<Locale>(locale);
  const [hasButton, setHasButton] = useState(
    Boolean(item?.cta_label_he || item?.cta_label_ar || item?.cta_href),
  );
  const [showPortrait, setShowPortrait] = useState(Boolean(item?.image_url));
  const [behavior, setBehavior] = useState(item?.click_behavior || "content");
  const [text, setText] = useState({
    title_he: item?.title_he || "",
    title_ar: item?.title_ar || "",
    description_he: item?.description_he || "",
    description_ar: item?.description_ar || "",
    cta_label_he: item?.cta_label_he || "",
    cta_label_ar: item?.cta_label_ar || "",
    media_title_he: item?.media_title_he || "",
    media_title_ar: item?.media_title_ar || "",
  });
  const link = item?.cta_href || `/${locale}`;
  const submit = async (formData: FormData) => {
    await saveSiteItem(locale, formData);
    onSaved();
    close();
  };
  return (
    <form className="cms-form" action={submit}>
      <input type="hidden" name="id" value={item?.id || ""} />
      <input type="hidden" name="section_id" value={sectionId} />
      <input
        type="hidden"
        name="parent_id"
        value={parentId ?? item?.parent_id ?? ""}
      />
      <input
        type="hidden"
        name="item_type"
        value={item?.item_type || "feature_card"}
      />
      {Object.entries(text).map(([name, value]) => (
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
        {tab === "he" ? "כותרת" : "العنوان"}
        <input
          required={tab === "he"}
          value={text[`title_${tab}`]}
          onChange={(event) =>
            setText((current) => ({
              ...current,
              [`title_${tab}`]: event.target.value,
            }))
          }
        />
      </label>
      <label>
        {tab === "he" ? "תיאור" : "الوصف"}
        <textarea
          value={text[`description_${tab}`]}
          onChange={(event) =>
            setText((current) => ({
              ...current,
              [`description_${tab}`]: event.target.value,
            }))
          }
        />
      </label>
      <label>
        {tab === "he"
          ? "מה קורה בלחיצה על הכרטיס?"
          : "ماذا يحدث عند النقر على البطاقة؟"}
        <select
          name="click_behavior"
          value={behavior}
          onChange={(event) =>
            setBehavior(
              event.target.value as "content" | "link" | "media" | "children",
            )
          }
        >
          <option value="content">
            {tab === "he" ? "תוכן רגיל" : "محتوى عادي"}
          </option>
          <option value="link">
            {tab === "he" ? "קישור / מעבר לדף" : "رابط / انتقال إلى صفحة"}
          </option>
          <option value="media">
            {tab === "he" ? "קובץ / מדיה" : "ملف / وسائط"}
          </option>
          <option value="children">
            {tab === "he" ? "הצג תתי־קבוצות" : "عرض المجموعات الفرعية"}
          </option>
        </select>
      </label>
      {behavior === "children" && (
        <label>
          {tab === "he"
            ? "מספר תתי־קבוצות בשורה"
            : "عدد المجموعات الفرعية في الصف"}
          <select
            name="child_columns"
            defaultValue={String(Number(item?.settings?.childColumns) || 3)}
          >
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
      )}
      <input
        type="hidden"
        name="has_button"
        value={hasButton ? "true" : "false"}
      />
      <label className="check">
        <input
          type="checkbox"
          checked={hasButton}
          onChange={(event) => setHasButton(event.target.checked)}
        />
        {tab === "he" ? "הצג כפתור בכרטיס" : "إظهار زر في البطاقة"}
      </label>
      {hasButton && (
        <>
          <label>
            {tab === "he" ? "טקסט הכפתור" : "نص الزر"}
            <input
              value={text[`cta_label_${tab}`]}
              onChange={(event) =>
                setText((current) => ({
                  ...current,
                  [`cta_label_${tab}`]: event.target.value,
                }))
              }
            />
          </label>
          <ButtonLinkFields locale={locale} initialValue={link} />
        </>
      )}
      {portraitOnly ? (
        <>
          <input type="hidden" name="media_position" value="top" />
          <input type="hidden" name="media_size" value="medium" />
          <input type="hidden" name="media_fit" value="cover" />
          <label className="check portrait-toggle">
            <input
              type="checkbox"
              checked={showPortrait}
              onChange={(event) => setShowPortrait(event.target.checked)}
            />
            {tab === "he" ? "הצג תמונה אישית" : "إظهار صورة شخصية"}
          </label>
          {showPortrait ? (
            <div className="portrait-upload">
              <p>
                {tab === "he"
                  ? "התמונה תופיע כאן כפורטרט עגול."
                  : "ستظهر الصورة هنا كصورة شخصية دائرية."}
              </p>
              <InlineMediaUpload
                locale={locale}
                initial={{
                  imageUrl: item?.image_url,
                  fileUrl: null,
                  fileName: item?.original_file_name,
                  mimeType: item?.media_mime_type,
                }}
              />
            </div>
          ) : (
            <p className="portrait-no-image">
              {tab === "he"
                ? "לא תוצג תמונה בכרטיס אודותיי."
                : "لن تظهر صورة في بطاقة من أنا."}
            </p>
          )}
        </>
      ) : (
        <>
          <InlineMediaUpload
            locale={locale}
            initial={{
              imageUrl: item?.image_url,
              fileUrl: item?.file_url,
              fileName: item?.original_file_name,
              mimeType: item?.media_mime_type,
            }}
          />
          <label>
            {tab === "he"
              ? "כותרת למדיה (אופציונלי)"
              : "عنوان الوسائط (اختياري)"}
            <input
              value={text[`media_title_${tab}`]}
              onChange={(event) =>
                setText((current) => ({
                  ...current,
                  [`media_title_${tab}`]: event.target.value,
                }))
              }
            />
          </label>
          <div className="media-options">
            <label>
              {tab === "he" ? "מיקום הקובץ" : "موضع الملف"}
              <select
                name="media_position"
                defaultValue={item?.media_position || "top"}
              >
                <option value="top">
                  {tab === "he" ? "למעלה" : "في الأعلى"}
                </option>
                <option value="bottom">
                  {tab === "he" ? "למטה" : "في الأسفل"}
                </option>
              </select>
            </label>
            <label>
              {tab === "he" ? "גודל" : "الحجم"}
              <select
                name="media_size"
                defaultValue={item?.media_size || "medium"}
              >
                <option value="small">{tab === "he" ? "קטן" : "صغير"}</option>
                <option value="medium">
                  {tab === "he" ? "בינוני" : "متوسط"}
                </option>
                <option value="large">{tab === "he" ? "גדול" : "كبير"}</option>
              </select>
            </label>
            <label>
              {tab === "he" ? "התאמת תמונה" : "ملاءمة الصورة"}
              <select
                name="media_fit"
                defaultValue={item?.media_fit || "cover"}
              >
                <option value="cover">{tab === "he" ? "מילוי" : "ملء"}</option>
                <option value="contain">
                  {tab === "he" ? "התאמה מלאה" : "احتواء كامل"}
                </option>
              </select>
            </label>
          </div>
        </>
      )}
      <label className="check">
        <input
          name="is_visible"
          type="checkbox"
          defaultChecked={item?.is_visible ?? true}
        />
        {tab === "he" ? "הכרטיס מוצג באתר" : "البطاقة ظاهرة في الموقع"}
      </label>
      {item && behavior === "children" && (
        <div className="child-groups-summary">
          <b>{tab === "he" ? "תתי־קבוצות" : "المجموعات الفرعية"}</b>
          {childItems.length ? (
            <ul>
              {childItems.map((child) => (
                <li key={child.id}>{local(child, "title", tab)}</li>
              ))}
            </ul>
          ) : (
            <p>
              {tab === "he"
                ? "אין עדיין תתי־קבוצות. ניתן להוסיף אותן מהקבוצה שנפתחת בעמוד."
                : "لا توجد مجموعات فرعية بعد. يمكن إضافتها من المجموعة المفتوحة في الصفحة."}
            </p>
          )}
        </div>
      )}
      <div className="drawer-actions">
        <button type="button" className="outline-button" onClick={close}>
          {tab === "he" ? "ביטול" : "إلغاء"}
        </button>
        <SaveButton locale={tab} />
      </div>
    </form>
  );
}

function Toast({ visible, locale }: { visible: boolean; locale: Locale }) {
  return visible ? (
    <div className="cms-toast" role="status">
      {locale === "he" ? "נשמר בהצלחה" : "تم الحفظ بنجاح"}
    </div>
  ) : null;
}

export function InlineItemEditor({
  locale,
  item,
  childItems = [],
  portraitOnly = false,
}: {
  locale: Locale;
  item: SiteItem;
  childItems?: SiteItem[];
  portraitOnly?: boolean;
}) {
  const editing = useCmsEditMode();
  const [open, setOpen] = useState(false),
    [confirm, setConfirm] = useState(false),
    [saved, setSaved] = useState(false);
  const router = useRouter();
  const showSaved = () => {
    setSaved(true);
    router.refresh();
    window.setTimeout(() => setSaved(false), 2800);
  };
  if (!editing) return null;
  return (
    <>
      <div className="inline-card-controls" style={{ display: "flex" }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="עריכת כרטיס"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          aria-label="מחיקת כרטיס"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <Toast visible={saved} locale={locale} />
      {confirm && (
        <div className="confirm-popover">
          <p>
            {locale === "he"
              ? `למחוק את הכרטיס '${item.title_he || ""}'?`
              : "حذف البطاقة؟"}
          </p>
          <button
            type="button"
            className="outline-button"
            onClick={() => setConfirm(false)}
          >
            {locale === "he" ? "ביטול" : "إلغاء"}
          </button>
          <form
            action={async (fd) => {
              await deleteSiteItem(locale, fd);
              setConfirm(false);
            }}
          >
            <input type="hidden" name="id" value={item.id} />
            <button className="danger-button">
              {locale === "he" ? "מחיקה" : "حذف"}
            </button>
          </form>
        </div>
      )}
      {open && (
        <EditorDrawer
          title={locale === "he" ? "עריכת כרטיס" : "تحرير البطاقة"}
          onClose={() => setOpen(false)}
        >
          <VisualCardEditor
            locale={locale}
            item={item}
            sectionId={item.section_id}
            onClose={() => setOpen(false)}
            onSaved={showSaved}
          />
        </EditorDrawer>
      )}
    </>
  );
}

export function AddItemCard({
  locale,
  sectionId,
  parentId,
  label,
  compact = false,
}: {
  locale: Locale;
  sectionId: string;
  parentId?: string;
  label: string;
  compact?: boolean;
}) {
  const editing = useCmsEditMode();
  const [open, setOpen] = useState(false),
    [saved, setSaved] = useState(false);
  const router = useRouter();
  const showSaved = () => {
    setSaved(true);
    router.refresh();
    window.setTimeout(() => setSaved(false), 2800);
  };
  if (!editing) return null;
  return (
    <>
      <button
        type="button"
        className={compact ? "add-child-action" : "add-cms-card"}
        style={{ display: compact ? "inline-flex" : "grid" }}
        onClick={() => setOpen(true)}
        aria-label={label}
      >
        <Plus size={compact ? 18 : 27} />
        <span>{label}</span>
      </button>
      <Toast visible={saved} locale={locale} />
      {open && (
        <EditorDrawer title={label} onClose={() => setOpen(false)}>
          <VisualCardEditor
            locale={locale}
            sectionId={sectionId}
            parentId={parentId}
            onClose={() => setOpen(false)}
            onSaved={showSaved}
          />
        </EditorDrawer>
      )}
    </>
  );
}
