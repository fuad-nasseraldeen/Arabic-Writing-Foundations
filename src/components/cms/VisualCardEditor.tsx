"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Image,
  Link2,
  Plus,
  Quote,
  Text,
  Type,
  X,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { SiteItem } from "@/lib/cms-shared";
import { saveVisualSiteItem } from "@/app/[locale]/admin/actions";
import { InlineMediaUpload } from "./InlineMediaUpload";

type Block = {
  id: string;
  type: "paragraph" | "subheading" | "source";
  he: string;
  ar: string;
};
const makeBlock = (type: Block["type"] = "paragraph"): Block => ({
  id: crypto.randomUUID(),
  type,
  he: "",
  ar: "",
});
const labels = {
  he: {
    edit: "עריכה",
    preview: "תצוגה מקדימה",
    title: "כותרת",
    add: "הוסף תוכן",
    paragraph: "פסקה",
    subheading: "כותרת משנה",
    source: "מקור",
    image: "תמונה",
    file: "PDF / קובץ",
    button: "כפתור / קישור",
    cancel: "ביטול",
    save: "שמור",
    saving: "שומר…",
    close: "סגירה",
    visibility: "הכרטיס מוצג באתר",
    buttonText: "טקסט הכפתור",
    target: "יעד",
    unsaved: "יש שינויים שלא נשמרו. לצאת בלי לשמור?",
    stay: "המשך עריכה",
    leave: "צא ללא שמירה",
    singleCard: "כרטיסיה בודדת",
    group: "קבוצה",
  },
  ar: {
    edit: "تحرير",
    preview: "معاينة",
    title: "العنوان",
    add: "إضافة محتوى",
    paragraph: "فقرة",
    subheading: "عنوان فرعي",
    source: "مرجع",
    image: "صورة",
    file: "PDF / ملف",
    button: "زر / رابط",
    cancel: "إلغاء",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    close: "إغلاق",
    visibility: "البطاقة ظاهرة في الموقع",
    buttonText: "نص الزر",
    target: "الوجهة",
    unsaved: "هناك تغييرات غير محفوظة. الخروج دون حفظ؟",
    stay: "متابعة التحرير",
    leave: "الخروج دون حفظ",
    singleCard: "بطاقة منفردة",
    group: "مجموعة",
  },
};
const destinations = (locale: Locale) => [
  {
    value: `/${locale}`,
    label: locale === "he" ? "דף הבית" : "الصفحة الرئيسية",
  },
  {
    value: `/${locale}/letters`,
    label: locale === "he" ? "אותיות בקבוצות" : "الحروف ضمن مجموعات",
  },
  {
    value: `/${locale}/worksheets`,
    label: locale === "he" ? "דפי עבודה" : "أوراق عمل",
  },
  {
    value: `/${locale}/resources`,
    label: locale === "he" ? "חומרי העשרה" : "مواد إثرائية",
  },
  {
    value: "custom",
    label: locale === "he" ? "קישור מותאם אישית" : "رابط مخصص",
  },
];
export function VisualCardEditor({
  locale,
  item,
  sectionId,
  parentId,
  onClose,
  onSaved,
}: {
  locale: Locale;
  item?: SiteItem;
  sectionId: string;
  parentId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<Locale>(locale),
    [mobile, setMobile] = useState<"edit" | "preview">("edit"),
    [saving, setSaving] = useState(false),
    [showMenu, setShowMenu] = useState(false),
    [dirty, setDirty] = useState(false),
    [confirm, setConfirm] = useState(false);
  const existing = (item?.settings?.contentBlocks as Block[] | undefined) || [];
  const [blocks, setBlocks] = useState<Block[]>(
    existing.length
      ? existing
      : [
          {
            id: "legacy",
            type: "paragraph",
            he: item?.description_he || "",
            ar: item?.description_ar || "",
          },
        ],
  );
  const [title, setTitle] = useState({
    he: item?.title_he || "",
    ar: item?.title_ar || "",
  });
  const [button, setButton] = useState({
    enabled: Boolean(item?.cta_label_he || item?.cta_label_ar),
    he: item?.cta_label_he || "",
    ar: item?.cta_label_ar || "",
    href: item?.cta_href || `/${locale}`,
  });
  const [behavior, setBehavior] = useState(
    item?.click_behavior === "children" ? "children" : "content",
  );
  const [media, setMedia] = useState({
    url: item?.file_url || item?.image_url || "",
    name: item?.original_file_name || "",
    mime: item?.media_mime_type || "",
    size: item?.media_size || "medium",
    fit: item?.media_fit || "cover",
    position: item?.media_position || "top",
  });
  const l = labels[tab];
  const previewMedia = media.url ? (
    media.mime === "application/pdf" ? (
      <div className="visual-preview-file">
        <FileText /> {media.name || "PDF"}
      </div>
    ) : (
      <img
        className={`preview-media-${media.size}`}
        src={media.url}
        alt=""
        style={{ objectFit: media.fit }}
      />
    )
  ) : null;
  const add = (type: Block["type"]) => {
    setBlocks((v) => [...v, makeBlock(type)]);
    setShowMenu(false);
    setDirty(true);
  };
  const previewBlocks = useMemo(
    () => blocks.filter((b) => b[tab].trim()),
    [blocks, tab],
  );
  const close = () => (dirty ? setConfirm(true) : onClose());
  const save = async (form: FormData) => {
    setSaving(true);
    form.set("content_blocks", JSON.stringify(blocks));
    form.set(
      "description_he",
      blocks
        .filter((b) => b.type === "paragraph")
        .map((b) => b.he)
        .filter(Boolean)
        .join("\n\n"),
    );
    form.set(
      "description_ar",
      blocks
        .filter((b) => b.type === "paragraph")
        .map((b) => b.ar)
        .filter(Boolean)
        .join("\n\n"),
    );
    await saveVisualSiteItem(locale, form);
    setSaving(false);
    onSaved();
    onClose();
  };
  return (
    <form className="visual-editor" action={save}>
      <input type="hidden" name="id" value={item?.id || ""} />
      <input type="hidden" name="section_id" value={sectionId} />
      <input
        type="hidden"
        name="parent_id"
        value={parentId || item?.parent_id || ""}
      />
      <input type="hidden" name="click_behavior" value={behavior} />
      <input
        type="hidden"
        name="image_url"
        value={media.mime === "application/pdf" ? "" : media.url}
      />
      <input
        type="hidden"
        name="file_url"
        value={media.mime === "application/pdf" ? media.url : ""}
      />
      <input type="hidden" name="original_file_name" value={media.name} />
      <input type="hidden" name="media_mime_type" value={media.mime} />
      <input type="hidden" name="title_he" value={title.he} />
      <input type="hidden" name="title_ar" value={title.ar} />
      <input
        type="hidden"
        name="has_button"
        value={button.enabled ? "true" : "false"}
      />
      <input
        type="hidden"
        name="cta_label_he"
        value={button.enabled ? button.he : ""}
      />
      <input
        type="hidden"
        name="cta_label_ar"
        value={button.enabled ? button.ar : ""}
      />
      <input
        type="hidden"
        name="cta_href"
        value={button.enabled ? button.href : ""}
      />
      <input type="hidden" name="media_size" value={media.size} />
      <input type="hidden" name="media_fit" value={media.fit} />
      <header className="visual-editor-header">
        <div>
          <h2>{item ? "עריכת כרטיס" : "הוספת כרטיס"}</h2>
          <div className="visual-language">
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
        </div>
        <button
          type="button"
          className="visual-close"
          onClick={close}
          aria-label={l.close}
        >
          <X />
        </button>
      </header>
      <div className="visual-mobile-tabs">
        <button
          type="button"
          className={mobile === "edit" ? "active" : ""}
          onClick={() => setMobile("edit")}
        >
          {l.edit}
        </button>
        <button
          type="button"
          className={mobile === "preview" ? "active" : ""}
          onClick={() => setMobile("preview")}
        >
          {l.preview}
        </button>
      </div>
      <div className="visual-editor-workspace">
        <section
          className={`visual-editor-pane ${mobile === "preview" ? "mobile-hidden" : ""}`}
        >
          <div
            className="visual-card-mode"
            role="group"
            aria-label={tab === "he" ? "סוג הכרטיסיה" : "نوع البطاقة"}
          >
            <button
              type="button"
              className={behavior === "children" ? "" : "active"}
              onClick={() => {
                setBehavior("content");
                setDirty(true);
              }}
            >
              {l.singleCard}
            </button>
            <button
              type="button"
              className={behavior === "children" ? "active" : ""}
              onClick={() => {
                setBehavior("children");
                setDirty(true);
              }}
            >
              {l.group}
            </button>
          </div>
          <label className="visual-title">
            <span>{l.title}</span>
            <input
              required={tab === "he"}
              value={title[tab]}
              onChange={(e) => {
                setTitle((v) => ({ ...v, [tab]: e.target.value }));
                setDirty(true);
              }}
            />
          </label>
          <div className="visual-blocks">
            {blocks.map((block, index) => (
              <div
                className={`visual-block block-${block.type}`}
                key={block.id}
              >
                <div className="block-label">
                  {block.type === "paragraph" ? (
                    <Text size={15} />
                  ) : block.type === "subheading" ? (
                    <Type size={15} />
                  ) : (
                    <Quote size={15} />
                  )}{" "}
                  {l[block.type]}
                </div>
                <textarea
                  value={block[tab]}
                  onChange={(e) => {
                    setBlocks((v) =>
                      v.map((b, i) =>
                        i === index ? { ...b, [tab]: e.target.value } : b,
                      ),
                    );
                    setDirty(true);
                  }}
                />
                <button
                  type="button"
                  className="block-remove"
                  aria-label="הסר"
                  onClick={() => {
                    setBlocks((v) => v.filter((_, i) => i !== index));
                    setDirty(true);
                  }}
                >
                  {tab === "he" ? "הסרה" : "إزالة"}
                </button>
              </div>
            ))}
          </div>
          <div className="add-content">
            <button type="button" onClick={() => setShowMenu((v) => !v)}>
              <Plus size={17} />
              {l.add}
            </button>
            {showMenu && (
              <div className="add-content-menu">
                <button type="button" onClick={() => add("paragraph")}>
                  <Text />
                  {l.paragraph}
                </button>
                <button type="button" onClick={() => add("subheading")}>
                  <Type />
                  {l.subheading}
                </button>
                <button type="button" onClick={() => add("source")}>
                  <Quote />
                  {l.source}
                </button>
                <label>
                  <Image />
                  {l.image}
                  <InlineMediaUpload
                    locale={tab}
                    initial={{
                      imageUrl:
                        media.mime === "application/pdf" ? "" : media.url,
                      fileUrl:
                        media.mime === "application/pdf" ? media.url : "",
                      fileName: media.name,
                      mimeType: media.mime,
                    }}
                    includeFields={false}
                    onChange={(next) => {
                      setMedia((current) => ({ ...current, ...next }));
                      setShowMenu(false);
                      setDirty(true);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setButton((v) => ({ ...v, enabled: true }));
                    setShowMenu(false);
                    setDirty(true);
                  }}
                >
                  <Link2 />
                  {l.button}
                </button>
              </div>
            )}
          </div>
          {media.url && (
            <div className="visual-block block-media">
              <div className="block-label">
                {media.mime === "application/pdf" ? (
                  <FileText size={15} />
                ) : (
                  <Image size={15} />
                )}{" "}
                {media.mime === "application/pdf" ? l.file : l.image}
              </div>
              {media.mime !== "application/pdf" ? (
                <img
                  className="visual-editor-media-thumb"
                  src={media.url}
                  alt=""
                />
              ) : (
                <div className="visual-editor-file-name">
                  <FileText size={20} />
                  {media.name || "PDF"}
                </div>
              )}
              <div className="visual-media-settings">
                <label>
                  {tab === "he" ? "גודל" : "الحجم"}
                  <select
                    value={media.size}
                    onChange={(e) =>
                      setMedia((v) => ({
                        ...v,
                        size: e.target.value as "small" | "medium" | "large",
                      }))
                    }
                  >
                    <option value="small">
                      {tab === "he" ? "קטן" : "صغير"}
                    </option>
                    <option value="medium">
                      {tab === "he" ? "בינוני" : "متوسط"}
                    </option>
                    <option value="large">
                      {tab === "he" ? "גדול" : "كبير"}
                    </option>
                  </select>
                </label>
                {media.mime !== "application/pdf" && (
                  <>
                    <label>
                      {tab === "he" ? "התאמת תמונה" : "ملاءمة الصورة"}
                      <select
                        value={media.fit}
                        onChange={(e) =>
                          setMedia((v) => ({
                            ...v,
                            fit: e.target.value as "cover" | "contain",
                          }))
                        }
                      >
                        <option value="cover">
                          {tab === "he" ? "מילוי" : "ملء"}
                        </option>
                        <option value="contain">
                          {tab === "he" ? "תמונה מלאה" : "احتواء كامل"}
                        </option>
                      </select>
                    </label>
                    <label>
                      {tab === "he" ? "מיקום" : "الموضع"}
                      <select
                        value={media.position}
                        onChange={(e) =>
                          setMedia((v) => ({
                            ...v,
                            position: e.target.value as "top" | "bottom",
                          }))
                        }
                      >
                        <option value="top">
                          {tab === "he" ? "למעלה" : "في الأعلى"}
                        </option>
                        <option value="bottom">
                          {tab === "he" ? "למטה" : "في الأسفل"}
                        </option>
                      </select>
                    </label>
                  </>
                )}
              </div>
            </div>
          )}
          {button.enabled && (
            <div className="visual-block block-button">
              <div className="block-label">
                <Link2 size={15} />
                {l.button}
              </div>
              <input
                placeholder={l.buttonText}
                value={button[tab]}
                onChange={(e) => {
                  setButton((v) => ({ ...v, [tab]: e.target.value }));
                  setDirty(true);
                }}
              />
              <select
                value={button.href}
                onChange={(e) =>
                  setButton((v) => ({ ...v, href: e.target.value }))
                }
              >
                {destinations(tab).map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {button.href === "custom" && (
                <input
                  placeholder="https://"
                  onChange={(e) =>
                    setButton((v) => ({ ...v, href: e.target.value }))
                  }
                />
              )}
            </div>
          )}
          <label className="visual-visible">
            <input
              name="is_visible"
              type="checkbox"
              defaultChecked={item?.is_visible ?? true}
            />
            {l.visibility}
          </label>
        </section>
        <aside
          className={`visual-preview-pane ${mobile === "edit" ? "mobile-hidden" : ""}`}
        >
          <h3>{l.preview}</h3>
          <div className="visual-canvas">
            <article className="visual-preview-card">
              {media.position === "top" && previewMedia}
              <h2>{title[tab] || l.title}</h2>
              {previewBlocks.map((b) =>
                b.type === "subheading" ? (
                  <h3 key={b.id}>{b[tab]}</h3>
                ) : b.type === "source" ? (
                  <small key={b.id}>{b[tab]}</small>
                ) : (
                  <p key={b.id}>{b[tab]}</p>
                ),
              )}
              {media.position === "bottom" && previewMedia}
              {button.enabled && button[tab] && (
                <span className="button">{button[tab]}</span>
              )}
            </article>
          </div>
        </aside>
      </div>
      <footer className="visual-editor-footer">
        <button type="button" className="outline-button" onClick={close}>
          {l.cancel}
        </button>
        <button className="button" disabled={saving}>
          {saving ? l.saving : l.save}
        </button>
      </footer>
      {confirm && (
        <div className="visual-confirm">
          <p>{l.unsaved}</p>
          <button type="button" onClick={() => setConfirm(false)}>
            {l.stay}
          </button>
          <button type="button" onClick={onClose}>
            {l.leave}
          </button>
        </div>
      )}
    </form>
  );
}
