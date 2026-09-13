"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  ImageIcon,
  Link2,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Quote,
  RefreshCw,
  Text,
  Trash2,
  Type,
  Underline,
  X,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { SiteItem } from "@/lib/cms-shared";
import { saveVisualSiteItem } from "@/app/[locale]/admin/actions";
import { InlineMediaUpload, type InlineMediaUploadHandle } from "./InlineMediaUpload";
import {
  normalizeItemToContentBlocks,
  resolveCardStyle,
  resolveTextBlockStyle,
  resolveTitleStyle,
  DEFAULT_BLOCK_STYLES,
  type ButtonContentBlock,
  type CardStyle,
  type ContentBlock,
  type MediaContentBlock,
  type TextBlockStyle,
  type TextContentBlock,
} from "./card-content";
import { CmsCard } from "./CmsCard";

type TextStyle = TextBlockStyle;
type TextBlock = TextContentBlock;
type MediaBlock = MediaContentBlock;
type ButtonBlock = ButtonContentBlock;
export type EditorBlock = ContentBlock;

type EditorProps = {
  item?: SiteItem | null;
  sectionId: string;
  parentId?: string;
  isGroup?: boolean;
  locale: Locale;
  onClose: () => void;
  onSaved?: (item: SiteItem) => void;
};

const id = () => crypto.randomUUID();
const labels: Record<Locale, Record<string, string>> = {
  he: {
    edit: "עריכת כרטיס", title: "כותרת", single: "כרטיסיה בודדת", group: "קבוצה",
    add: "הוסף תוכן", paragraph: "פסקה", subheading: "כותרת משנה", source: "מקור",
    image: "תמונה", pdf: "PDF / קובץ", button: "כפתור / קישור", text: "טקסט",
    media: "מדיה", action: "פעולה", chooseImage: "בחר תמונה", choosePdf: "בחר PDF",
    replaceImage: "החלף תמונה", replaceFile: "החלף קובץ", displayName: "שם להצגה",
    viewDocument: "צפייה במסמך", align: "יישור", width: "רוחב", actions: "פעולות", size: "גודל", spacing: "ריווח",
    start: "התחלה", center: "מרכז", end: "סוף", small: "קטן", normal: "רגיל",
    large: "גדול", heading: "כותרת", tight: "צפוף", loose: "מרווח", noSpacing: "ללא רווח",
    medium: "בינוני", full: "מלא", fit: "התאמה", cover: "מילוי", contain: "תמונה מלאה",
    bold: "מודגש", underline: "קו תחתון",
    cardDesign: "עיצוב הכרטיס", background: "רקע", border: "מסגרת", density: "צפיפות", showChildCount: "הצג מספר פריטים", items: "פריטים", on: "פעיל", off: "כבוי",
    default: "רגיל", accent: "מודגש", softBorder: "עדינה", none: "ללא", compact: "קומפקטי", relaxed: "מרווח",
    moveUp: "הזז למעלה", moveDown: "הזז למטה", duplicate: "שכפל", remove: "מחק",
    cancel: "ביטול", save: "שמור", saving: "שומר...", saveFailed: "השינויים לא נשמרו. נסו שוב.", buttonText: "טקסט הכפתור",
    destination: "יעד", close: "סגור",
  },
  ar: {
    edit: "تعديل البطاقة", title: "العنوان", single: "بطاقة مفردة", group: "مجموعة",
    add: "إضافة محتوى", paragraph: "فقرة", subheading: "عنوان فرعي", source: "مصدر",
    image: "صورة", pdf: "PDF / ملف", button: "زر / رابط", text: "نص",
    media: "وسائط", action: "إجراء", chooseImage: "اختر صورة", choosePdf: "اختر PDF",
    replaceImage: "استبدال الصورة", replaceFile: "استبدال الملف", displayName: "اسم العرض",
    viewDocument: "عرض المستند", align: "محاذاة", width: "العرض", actions: "إجراءات", size: "الحجم", spacing: "التباعد",
    start: "بداية", center: "وسط", end: "نهاية", small: "صغير", normal: "عادي",
    large: "كبير", heading: "عنوان", tight: "ضيق", loose: "واسع", noSpacing: "بدون تباعد",
    medium: "متوسط", full: "كامل", fit: "الملاءمة", cover: "ملء", contain: "الصورة كاملة",
    bold: "عريض", underline: "تحته خط",
    cardDesign: "تصميم البطاقة", background: "الخلفية", border: "الإطار", density: "الكثافة", showChildCount: "إظهار عدد العناصر", items: "عناصر", on: "تشغيل", off: "إيقاف",
    default: "عادي", accent: "بارز", softBorder: "ناعم", none: "بدون", compact: "مضغوط", relaxed: "مريح",
    moveUp: "نقل لأعلى", moveDown: "نقل لأسفل", duplicate: "نسخ", remove: "حذف",
    cancel: "إلغاء", save: "حفظ", saving: "جارٍ الحفظ...", saveFailed: "لم يتم حفظ التغييرات. حاولوا مرة أخرى.", buttonText: "نص الزر",
    destination: "الوجهة", close: "إغلاق",
  },
};

const makeBlock = (type: EditorBlock["type"]): EditorBlock => {
  if (type === "image" || type === "pdf") return { id: id(), type, media: { url: "" } };
  if (type === "button") return { id: id(), type, he: "", ar: "", href: "" };
  return { id: id(), type, he: "", ar: "", style: {} };
};

export function VisualCardEditor({ item, sectionId, parentId, isGroup = false, locale, onClose, onSaved }: EditorProps) {
  const [language, setLanguage] = useState<Locale>(locale);
  const [title, setTitle] = useState({ he: item?.title_he || "", ar: item?.title_ar || "" });
  const [titleStyle, setTitleStyle] = useState<TextStyle>(() => (item?.settings?.titleStyle as TextStyle) ?? {});
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => normalizeItemToContentBlocks(item));
  // Keep the stored shape intact while editing; legacy presentation keys are
  // deliberately ignored by rendering, not stripped from production data.
  const [cardStyle, setCardStyle] = useState<CardStyle>(() => (item?.settings?.cardStyle as CardStyle) ?? {});
  const [kind, setKind] = useState(
    isGroup || item?.item_type === "group" || item?.click_behavior === "children"
      ? "group"
      : "card",
  );
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id || null);
  const [openBlockMenuId, setOpenBlockMenuId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [cardStyleOpen, setCardStyleOpen] = useState(false);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const editorToolsRef = useRef<HTMLDivElement>(null);
  const l = labels[language];
  const previewItem = {
    ...(item as NonNullable<typeof item>),
    title_he: title.he,
    title_ar: title.ar,
    settings: { ...(item?.settings || {}), titleStyle, cardStyle, contentBlocks: blocks },
  };
  useEffect(() => {
    if (!addOpen && !cardStyleOpen) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !editorToolsRef.current?.contains(target)) {
        setAddOpen(false);
        setCardStyleOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [addOpen, cardStyleOpen]);
  const update = (block: EditorBlock) => setBlocks((current) => current.map((entry) => entry.id === block.id ? block : entry));
  const remove = (blockId: string) => {
    setBlocks((current) => current.filter((entry) => entry.id !== blockId));
    setSelectedId((current) => current === blockId ? null : current);
  };
  const duplicate = (blockId: string) => setBlocks((current) => {
    const index = current.findIndex((entry) => entry.id === blockId);
    if (index < 0) return current;
    const copy = JSON.parse(JSON.stringify(current[index])) as EditorBlock;
    copy.id = id();
    return current.slice(0, index + 1).concat(copy, current.slice(index + 1));
  });
  const move = (blockId: string, amount: number) => setBlocks((current) => {
    const index = current.findIndex((entry) => entry.id === blockId);
    const next = index + amount;
    if (index < 0 || next < 0 || next >= current.length) return current;
    const result = current.slice();
    [result[index], result[next]] = [result[next], result[index]];
    return result;
  });
  const add = (type: EditorBlock["type"]) => {
    const block = makeBlock(type);
    setBlocks((current) => current.concat(block));
    setSelectedId(block.id);
    setAddOpen(false);
    window.requestAnimationFrame(() => {
      const added = document.getElementById(`visual-block-${block.id}`);
      added?.scrollIntoView({ behavior: "smooth", block: "end" });
      const field = added?.querySelector<HTMLElement>("textarea, input, button");
      field?.focus({ preventScroll: true });
    });
  };
  const save = async () => {
    setSaving(true);
    setSaveError(null);
    const image = blocks.find((block): block is MediaBlock => block.type === "image" && Boolean(block.media.url));
    const file = blocks.find((block): block is MediaBlock => block.type === "pdf" && Boolean(block.media.url));
    const button = blocks.find((block): block is ButtonBlock => block.type === "button");
    const text = blocks.find((block): block is TextBlock => block.type === "paragraph");
    const data = new FormData();
    const fields: Record<string, string> = {
      id: item?.id || "", section_id: sectionId, parent_id: parentId || item?.parent_id || "",
      // Groups are an interaction mode. The database stores their card shell
      // as feature_card and derives the group behavior from click_behavior.
      item_type: "feature_card", click_behavior: kind === "group" ? "children" : "content",
      title_he: title.he, title_ar: title.ar, description_he: text?.he || "", description_ar: text?.ar || "",
      image_url: image?.media.url || "", file_url: file?.media.url || "",
      original_file_name: image?.media.name || file?.media.name || "", media_mime_type: image?.media.mime || "",
      cta_label_he: button?.he || "", cta_label_ar: button?.ar || "", cta_href: button?.href || "",
      content_blocks: JSON.stringify(blocks), title_style: JSON.stringify(titleStyle), card_style: JSON.stringify(cardStyle), child_columns: String(item?.settings?.childColumns || 3),
    };
    Object.entries(fields).forEach(([key, value]) => data.set(key, value));
    if (button) data.set("has_button", "true");
    if (item?.is_visible !== false) data.set("is_visible", "on");
    try {
      await saveVisualSiteItem(locale, data);
      onSaved?.(item as SiteItem);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error && error.message ? error.message : l.saveFailed);
    } finally { setSaving(false); }
  };
  return <div className="visual-editor" dir={language === "he" ? "rtl" : "rtl"}>
    <header className="visual-editor-header"><h2>{l.edit}</h2><button type="button" className="visual-close icon-button" onClick={onClose} title={l.close} aria-label={l.close}><X size={18} /></button></header>
    <div className="visual-mobile-tabs"><button className={tab === "editor" ? "active" : ""} onClick={() => setTab("editor")}>{l.edit}</button><button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}>תצוגה מקדימה</button></div>
    <div className="visual-editor-workspace">
      <section dir="rtl" className={"visual-editor-pane " + (tab === "preview" ? "mobile-hidden" : "")}>
        <div className="visual-editor-tools" ref={editorToolsRef}>
          <div className="add-content"><button type="button" className="outline-button compact-button" onClick={() => { setAddOpen((open) => !open); setCardStyleOpen(false); }}><Plus size={15} /> {l.add}</button>{addOpen && <AddMenu l={l} onAdd={add} />}</div>
          <div className="card-style-action"><button type="button" className="outline-button compact-button" onClick={() => { setCardStyleOpen((open) => !open); setAddOpen(false); }}>{l.cardDesign}</button>{cardStyleOpen && <CardStylePanel l={l} style={cardStyle} onChange={setCardStyle} />}</div>
        </div>
        <section className="visual-title-block">
          <label className="visual-title">{l.title}<input value={title[language]} onChange={(event) => setTitle({ ...title, [language]: event.target.value })} /></label>
          <TitleControls l={l} style={titleStyle} cardStyle={cardStyle} onChange={setTitleStyle} />
        </section>
        <div className="visual-block-list">{blocks.map((block, index) => <BlockEditor key={block.id} block={block} locale={language} cardStyle={cardStyle} selected={selectedId === block.id} menuOpen={openBlockMenuId === block.id} index={index} total={blocks.length} onSelect={() => setSelectedId(block.id)} onUpdate={update} onRemove={() => remove(block.id)} onMove={move} onDuplicate={() => duplicate(block.id)} onMenu={(open) => setOpenBlockMenuId(open ? block.id : null)} />)}</div>
      </section>
      <section dir="rtl" className={"visual-preview-pane " + (tab === "editor" ? "mobile-hidden" : "")}>
        <div className="visual-preview-toolbar">
          <div className="visual-language"><button type="button" className={language === "he" ? "active" : ""} onClick={() => setLanguage("he")}>עברית</button><button type="button" className={language === "ar" ? "active" : ""} onClick={() => setLanguage("ar")}>العربية</button></div>
          <div className="visual-preview-actions"><div className="visual-card-mode"><button type="button" className={kind === "card" ? "active" : ""} onClick={() => setKind("card")}>{l.single}</button><button type="button" className={kind === "group" ? "active" : ""} onClick={() => setKind("group")}>{l.group}</button></div></div>
        </div>
        <CmsCard item={previewItem} locale={language} childCount={kind === "group" ? 2 : 0} className="visual-preview-card-shell" preview />
      </section>
    </div>
    <footer className="visual-editor-footer"><div className="visual-save-feedback" aria-live="polite">{saving && <span>{l.saving}</span>}{saveError && <p role="alert">{saveError}</p>}</div><button type="button" className="outline-button compact-button" disabled={saving} onClick={onClose}>{l.cancel}</button><button type="button" className="button compact-button" disabled={saving} onClick={save}>{saving && <LoaderCircle className="spin" size={15} />}{saving ? l.saving : l.save}</button></footer>
  </div>;
}

function CardStylePanel({ l, style, onChange }: { l: Record<string, string>; style: CardStyle; onChange: (style: CardStyle) => void }) {
  const resolved = resolveCardStyle(style);
  return <div className="card-style-panel"><Segment l={l} label={l.align} value={resolved.align} choices={["start", "center", "end"]} onChange={(align) => onChange({ ...style, align: align as CardStyle["align"] })} /><Segment l={l} label={l.background} value={resolved.background} choices={["default", "soft", "accent"]} onChange={(background) => onChange({ ...style, background: background as CardStyle["background"] })} /><Segment l={l} label={l.border} value={resolved.border} choices={["default", "soft", "none"]} onChange={(border) => onChange({ ...style, border: border as CardStyle["border"] })} /><Segment l={l} label={l.density} value={resolved.density} choices={["compact", "normal", "relaxed"]} onChange={(density) => onChange({ ...style, density: density as CardStyle["density"] })} /><Toggle l={l} label={l.showChildCount} pressed={resolved.showItemCount} onChange={(showItemCount) => onChange({ ...style, showItemCount })} /></div>;
}

function Toggle({ l, label, pressed, onChange }: { l: Record<string, string>; label: string; pressed: boolean; onChange: (value: boolean) => void }) {
  return <div className="editor-toggle"><span>{label}</span><button type="button" className={"interactive-button " + (pressed ? "active" : "")} aria-pressed={pressed} onClick={() => onChange(!pressed)}>{pressed ? l.on : l.off}</button></div>;
}

function AddMenu({ l, onAdd }: { l: Record<string, string>; onAdd: (type: EditorBlock["type"]) => void }) {
  return <div className="add-content-menu" role="menu"><strong>{l.text}</strong><button onClick={() => onAdd("paragraph")}><Text size={15} />{l.paragraph}</button><button onClick={() => onAdd("subheading")}><Type size={15} />{l.subheading}</button><button onClick={() => onAdd("source")}><Quote size={15} />{l.source}</button><strong>{l.media}</strong><button onClick={() => onAdd("image")}><ImageIcon size={15} />{l.image}</button><button onClick={() => onAdd("pdf")}><FileText size={15} />{l.pdf}</button><strong>{l.action}</strong><button onClick={() => onAdd("button")}><Link2 size={15} />{l.button}</button></div>;
}

function BlockEditor({ block, locale, cardStyle, selected, menuOpen, index, total, onSelect, onUpdate, onRemove, onMove, onDuplicate, onMenu }: { block: EditorBlock; locale: Locale; cardStyle: CardStyle; selected: boolean; menuOpen: boolean; index: number; total: number; onSelect: () => void; onUpdate: (block: EditorBlock) => void; onRemove: () => void; onMove: (id: string, amount: number) => void; onDuplicate: () => void; onMenu: (open: boolean) => void }) {
  const l = labels[locale];
  const picker = useRef<InlineMediaUploadHandle>(null);
  const media = block.type === "image" || block.type === "pdf";
  const icon = block.type === "image" ? <ImageIcon size={15} /> : block.type === "pdf" ? <FileText size={15} /> : block.type === "source" ? <Quote size={15} /> : block.type === "subheading" ? <Type size={15} /> : block.type === "button" ? <Link2 size={15} /> : <Text size={15} />;
  const name = l[block.type === "paragraph" ? "paragraph" : block.type] as string;
  const setMedia = (value: { url: string; name?: string; mime?: string }) => media && onUpdate({ ...block, media: { ...block.media, ...value } } as MediaBlock);
  return <article id={`visual-block-${block.id}`} className={"visual-block block-" + block.type + (selected ? " selected" : "")} onClick={onSelect}>
    <header><b>{icon}{name}</b>{media && block.media.url && <button type="button" className="icon-button block-replace" title={block.type === "image" ? l.replaceImage : l.replaceFile} aria-label={block.type === "image" ? l.replaceImage : l.replaceFile} onClick={(event) => { event.stopPropagation(); picker.current?.open(); }}><RefreshCw size={15} /></button>}<button type="button" className="icon-button" title={l.remove} aria-label={l.remove} onClick={(event) => { event.stopPropagation(); onRemove(); }}><X size={16} /></button><div className="block-actions"><button type="button" className="icon-button" title={l.actions} aria-label={l.actions} onClick={(event) => { event.stopPropagation(); onMenu(!menuOpen); }}><MoreHorizontal size={17} /></button>{menuOpen && <BlockMenu l={l} index={index} total={total} onMove={onMove} blockId={block.id} onDuplicate={onDuplicate} onRemove={onRemove} close={() => onMenu(false)} />}</div></header>
    {media ? <MediaEditor block={block as MediaBlock} l={l} picker={picker} onMedia={setMedia} onUpdate={onUpdate} /> : block.type === "button" ? <ButtonEditor block={block} locale={locale} onUpdate={onUpdate} /> : <TextEditor block={block as TextBlock} locale={locale} cardStyle={resolveCardStyle(cardStyle)} selected={selected} onUpdate={onUpdate} />}
  </article>;
}

function BlockMenu({ l, index, total, blockId, onMove, onDuplicate, onRemove, close }: { l: Record<string, string>; index: number; total: number; blockId: string; onMove: (id: string, amount: number) => void; onDuplicate: () => void; onRemove: () => void; close: () => void }) {
  useEffect(() => { const outside = (event: MouseEvent) => { if (!(event.target as Element).closest(".block-actions")) close(); }; const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); }; document.addEventListener("mousedown", outside); document.addEventListener("keydown", key); return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", key); }; }, [close]);
  const run = (action: () => void) => { action(); close(); };
  return <div className="block-popover" role="menu"><button disabled={index === 0} onClick={() => run(() => onMove(blockId, -1))}><ChevronUp size={15} />{l.moveUp}</button><button disabled={index === total - 1} onClick={() => run(() => onMove(blockId, 1))}><ChevronDown size={15} />{l.moveDown}</button><button onClick={() => run(onDuplicate)}><Copy size={15} />{l.duplicate}</button><button className="danger" onClick={() => run(onRemove)}><Trash2 size={15} />{l.remove}</button></div>;
}

function TextEditor({ block, locale, cardStyle, selected, onUpdate }: { block: TextBlock; locale: Locale; cardStyle: ReturnType<typeof resolveCardStyle>; selected: boolean; onUpdate: (block: EditorBlock) => void }) {
  const l = labels[locale]; const style = block.style || {};
  const set = (patch: Partial<TextStyle>) => onUpdate({ ...block, style: { ...style, ...patch } });
  return <><textarea value={block[locale]} onChange={(event) => onUpdate({ ...block, [locale]: event.target.value })} rows={2} />
    {selected && <StyleControls l={l} style={style} defaults={resolveTextBlockStyle(block, cardStyle)} onChange={set} />}</>;
}

function TitleControls({ l, style, cardStyle, onChange }: { l: Record<string, string>; style: TextStyle; cardStyle: CardStyle; onChange: (style: TextStyle) => void }) {
  return <div className="title-controls"><StyleControls l={l} style={style} defaults={resolveTitleStyle(style, resolveCardStyle(cardStyle))} onChange={(patch) => onChange({ ...style, ...patch })} /></div>;
}

function StyleControls({ l, style, defaults, onChange }: { l: Record<string, string>; style: TextStyle; defaults: Required<TextStyle>; onChange: (patch: Partial<TextStyle>) => void }) {
  const resolved = { align: style.align ?? defaults.align, size: style.size ?? defaults.size, spacing: style.spacing ?? defaults.spacing, bold: style.bold ?? defaults.bold, underline: style.underline ?? defaults.underline };
  return <div className="text-controls"><Segment l={l} label={l.align} value={resolved.align} choices={["start", "center", "end"]} onChange={(align) => onChange({ align: align as TextStyle["align"] })} /><Segment l={l} label={l.size} value={resolved.size} choices={["small", "normal", "large", "heading"]} onChange={(size) => onChange({ size: size as TextStyle["size"] })} /><Segment l={l} label={l.spacing} value={resolved.spacing} choices={["none", "tight", "normal", "loose"]} onChange={(spacing) => onChange({ spacing: spacing as TextStyle["spacing"] })} /><div className="format-buttons"><button type="button" className={resolved.bold ? "active" : ""} title={l.bold} aria-label={l.bold} onClick={() => onChange({ bold: !resolved.bold })}><Bold size={15} /></button><button type="button" className={resolved.underline ? "active" : ""} title={l.underline} aria-label={l.underline} onClick={() => onChange({ underline: !resolved.underline })}><Underline size={15} /></button></div></div>;
}

function Segment({ l, label, value, choices, onChange }: { l: Record<string, string>; label: string; value: string; choices: string[]; onChange: (value: string) => void }) {
  return <label className="editor-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{choices.map((choice) => <option key={choice} value={choice}>{choice === "none" && label === l.spacing ? l.noSpacing : l[choice]}</option>)}</select></label>;
}

function MediaEditor({ block, l, picker, onMedia, onUpdate }: { block: MediaBlock; l: Record<string, string>; picker: React.RefObject<InlineMediaUploadHandle | null>; onMedia: (value: { url: string; name?: string; mime?: string }) => void; onUpdate: (block: EditorBlock) => void }) {
  const updateMedia = (patch: Partial<MediaBlock["media"]>) => onUpdate({ ...block, media: { ...block.media, ...patch } });
  const image = block.type === "image";
  return <div className="block-media-editor"><InlineMediaUpload ref={picker} compact locale={l.edit === "עריכת כרטיס" ? "he" : "ar"} initial={block.type === "image" ? { imageUrl: block.media.url, fileName: block.media.name, mimeType: block.media.mime } : { fileUrl: block.media.url, fileName: block.media.name, mimeType: block.media.mime }} includeFields={false} onChange={onMedia} />
    {!block.media.url ? <button type="button" className="media-picker" onClick={() => picker.current?.open()}>{image ? <ImageIcon size={22} /> : <FileText size={22} />}<span>{image ? l.chooseImage : l.choosePdf}</span></button> : image ? <><img className={"visual-editor-media-thumb card-content__align--" + (block.media.align ?? DEFAULT_BLOCK_STYLES.image.align)} src={block.media.url} alt="" /><div className="media-settings"><Segment l={l} label={l.width} value={block.media.width ?? DEFAULT_BLOCK_STYLES.image.width} choices={["small", "medium", "large", "full"]} onChange={(width) => updateMedia({ width: width as MediaBlock["media"]["width"] })} /><Segment l={l} label={l.fit} value={block.media.fit ?? DEFAULT_BLOCK_STYLES.image.fit} choices={["cover", "contain"]} onChange={(fit) => updateMedia({ fit: fit as MediaBlock["media"]["fit"] })} /><Segment l={l} label={l.align} value={block.media.align ?? DEFAULT_BLOCK_STYLES.image.align} choices={["start", "center", "end"]} onChange={(align) => updateMedia({ align: align as MediaBlock["media"]["align"] })} /></div></> : <><div className="pdf-tile"><FileText size={24} /><span>{block.media.displayName || l.viewDocument}</span></div><label className="media-display-name">{l.displayName}<input value={block.media.displayName || ""} onChange={(event) => updateMedia({ displayName: event.target.value })} /></label></>}
  </div>;
}

function ButtonEditor({ block, locale, onUpdate }: { block: ButtonBlock; locale: Locale; onUpdate: (block: EditorBlock) => void }) {
  const l = labels[locale]; return <div className="button-block-fields"><label>{l.buttonText}<input value={block[locale]} onChange={(event) => onUpdate({ ...block, [locale]: event.target.value })} /></label><label>{l.destination}<input value={block.href} onChange={(event) => onUpdate({ ...block, href: event.target.value })} /></label></div>;
}
