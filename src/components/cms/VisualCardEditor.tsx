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

type TextStyle = {
  align?: "start" | "center" | "end";
  size?: "small" | "normal" | "large" | "heading";
  spacing?: "tight" | "normal" | "loose";
  bold?: boolean;
  underline?: boolean;
};
type TextBlock = {
  id: string;
  type: "paragraph" | "subheading" | "source";
  he: string;
  ar: string;
  style?: TextStyle;
};
type MediaBlock = {
  id: string;
  type: "image" | "pdf";
  media: {
    url: string;
    name?: string;
    mime?: string;
    displayName?: string;
    width?: "small" | "medium" | "large" | "full";
    fit?: "cover" | "contain";
    align?: "start" | "center" | "end";
  };
};
type ButtonBlock = { id: string; type: "button"; he: string; ar: string; href: string };
export type EditorBlock = TextBlock | MediaBlock | ButtonBlock;

type EditorProps = {
  item?: SiteItem | null;
  sectionId: string;
  parentId?: string;
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
    large: "גדול", heading: "כותרת", tight: "צפוף", loose: "מרווח",
    medium: "בינוני", full: "מלא", fit: "התאמה", cover: "מילוי", contain: "תמונה מלאה",
    bold: "מודגש", underline: "קו תחתון",
    moveUp: "הזז למעלה", moveDown: "הזז למטה", duplicate: "שכפל", remove: "מחק",
    cancel: "ביטול", save: "שמור", saving: "שומר...", buttonText: "טקסט הכפתור",
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
    large: "كبير", heading: "عنوان", tight: "ضيق", loose: "واسع",
    medium: "متوسط", full: "كامل", fit: "الملاءمة", cover: "ملء", contain: "الصورة كاملة",
    bold: "عريض", underline: "تحته خط",
    moveUp: "نقل لأعلى", moveDown: "نقل لأسفل", duplicate: "نسخ", remove: "حذف",
    cancel: "إلغاء", save: "حفظ", saving: "جارٍ الحفظ...", buttonText: "نص الزر",
    destination: "الوجهة", close: "إغلاق",
  },
};

export function normalizeItemToEditorBlocks(item?: SiteItem | null): EditorBlock[] {
  const saved = item?.settings?.contentBlocks;
  if (Array.isArray(saved)) return saved as EditorBlock[];
  if (!item) return [];
  const blocks: EditorBlock[] = [];
  if (item.description_he || item.description_ar) blocks.push({ id: id(), type: "paragraph", he: item.description_he || "", ar: item.description_ar || "" });
  if (item.image_url) blocks.push({ id: id(), type: "image", media: { url: item.image_url, name: item.original_file_name || "", mime: item.media_mime_type || "" } });
  if (item.file_url) blocks.push({ id: id(), type: "pdf", media: { url: item.file_url, name: item.original_file_name || "" } });
  if (item.cta_label_he || item.cta_label_ar || item.cta_href) blocks.push({ id: id(), type: "button", he: item.cta_label_he || "", ar: item.cta_label_ar || "", href: item.cta_href || "" });
  return blocks;
}

const makeBlock = (type: EditorBlock["type"]): EditorBlock => {
  if (type === "image" || type === "pdf") return { id: id(), type, media: { url: "" } };
  if (type === "button") return { id: id(), type, he: "", ar: "", href: "" };
  return { id: id(), type, he: "", ar: "", style: {} };
};

export function VisualCardEditor({ item, sectionId, parentId, locale, onClose, onSaved }: EditorProps) {
  const [language, setLanguage] = useState<Locale>(locale);
  const [title, setTitle] = useState({ he: item?.title_he || "", ar: item?.title_ar || "" });
  const [titleStyle, setTitleStyle] = useState<TextStyle>(() => (item?.settings?.titleStyle as TextStyle) || {});
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => normalizeItemToEditorBlocks(item));
  const [kind, setKind] = useState(item?.item_type === "group" ? "group" : "card");
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id || null);
  const [openBlockMenuId, setOpenBlockMenuId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [saving, setSaving] = useState(false);
  const l = labels[language];
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
  };
  const save = async () => {
    setSaving(true);
    const image = blocks.find((block): block is MediaBlock => block.type === "image" && Boolean(block.media.url));
    const file = blocks.find((block): block is MediaBlock => block.type === "pdf" && Boolean(block.media.url));
    const button = blocks.find((block): block is ButtonBlock => block.type === "button");
    const text = blocks.find((block): block is TextBlock => block.type === "paragraph");
    const data = new FormData();
    const fields: Record<string, string> = {
      id: item?.id || "", section_id: sectionId, parent_id: parentId || item?.parent_id || "",
      item_type: kind === "group" ? "group" : "feature_card", click_behavior: kind === "group" ? "children" : "content",
      title_he: title.he, title_ar: title.ar, description_he: text?.he || "", description_ar: text?.ar || "",
      image_url: image?.media.url || "", file_url: file?.media.url || "",
      original_file_name: image?.media.name || file?.media.name || "", media_mime_type: image?.media.mime || "",
      cta_label_he: button?.he || "", cta_label_ar: button?.ar || "", cta_href: button?.href || "",
      content_blocks: JSON.stringify(blocks), title_style: JSON.stringify(titleStyle), child_columns: String(item?.settings?.childColumns || 3),
    };
    Object.entries(fields).forEach(([key, value]) => data.set(key, value));
    if (button) data.set("has_button", "true");
    if (item?.is_visible !== false) data.set("is_visible", "on");
    try {
      await saveVisualSiteItem(locale, data);
      onSaved?.(item as SiteItem);
      onClose();
    } finally { setSaving(false); }
  };
  return <div className="visual-editor" dir={language === "he" ? "rtl" : "rtl"}>
    <header className="visual-editor-header"><h2>{l.edit}</h2><button type="button" className="visual-close icon-button" onClick={onClose} title={l.close} aria-label={l.close}><X size={18} /></button></header>
    <div className="visual-mobile-tabs"><button className={tab === "editor" ? "active" : ""} onClick={() => setTab("editor")}>{l.edit}</button><button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}>תצוגה מקדימה</button></div>
    <div className="visual-editor-workspace">
      <section dir="rtl" className={"visual-editor-pane " + (tab === "preview" ? "mobile-hidden" : "")}>
        <section className="visual-title-block">
          <label className="visual-title">{l.title}<input value={title[language]} onChange={(event) => setTitle({ ...title, [language]: event.target.value })} /></label>
          <TitleControls l={l} style={titleStyle} onChange={setTitleStyle} />
        </section>
        <div className="visual-block-list">{blocks.map((block, index) => <BlockEditor key={block.id} block={block} locale={language} selected={selectedId === block.id} menuOpen={openBlockMenuId === block.id} index={index} total={blocks.length} onSelect={() => setSelectedId(block.id)} onUpdate={update} onRemove={() => remove(block.id)} onMove={move} onDuplicate={() => duplicate(block.id)} onMenu={(open) => setOpenBlockMenuId(open ? block.id : null)} />)}</div>
      </section>
      <section dir="rtl" className={"visual-preview-pane " + (tab === "editor" ? "mobile-hidden" : "")}>
        <div className="visual-preview-toolbar">
          <div className="visual-language"><button type="button" className={language === "he" ? "active" : ""} onClick={() => setLanguage("he")}>עברית</button><button type="button" className={language === "ar" ? "active" : ""} onClick={() => setLanguage("ar")}>العربية</button></div>
          <div className="visual-preview-actions"><div className="visual-card-mode"><button type="button" className={kind === "card" ? "active" : ""} onClick={() => setKind("card")}>{l.single}</button><button type="button" className={kind === "group" ? "active" : ""} onClick={() => setKind("group")}>{l.group}</button></div><div className="add-content"><button type="button" className="outline-button compact-button" onClick={() => setAddOpen((open) => !open)}><Plus size={15} /> {l.add}</button>{addOpen && <AddMenu l={l} onAdd={add} onClose={() => setAddOpen(false)} />}</div></div>
        </div>
        <Preview title={title[language]} titleStyle={titleStyle} blocks={blocks} locale={language} />
      </section>
    </div>
    <footer className="visual-editor-footer"><button type="button" className="outline-button compact-button" onClick={onClose}>{l.cancel}</button><button type="button" className="button compact-button" disabled={saving} onClick={save}>{saving && <LoaderCircle className="spin" size={15} />}{saving ? l.saving : l.save}</button></footer>
  </div>;
}

function AddMenu({ l, onAdd, onClose }: { l: Record<string, string>; onAdd: (type: EditorBlock["type"]) => void; onClose: () => void }) {
  useEffect(() => { const close = (event: MouseEvent) => { if (!(event.target as Element).closest(".add-content")) onClose(); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, [onClose]);
  return <div className="add-content-menu" role="menu"><strong>{l.text}</strong><button onClick={() => onAdd("paragraph")}><Text size={15} />{l.paragraph}</button><button onClick={() => onAdd("subheading")}><Type size={15} />{l.subheading}</button><button onClick={() => onAdd("source")}><Quote size={15} />{l.source}</button><strong>{l.media}</strong><button onClick={() => onAdd("image")}><ImageIcon size={15} />{l.image}</button><button onClick={() => onAdd("pdf")}><FileText size={15} />{l.pdf}</button><strong>{l.action}</strong><button onClick={() => onAdd("button")}><Link2 size={15} />{l.button}</button></div>;
}

function BlockEditor({ block, locale, selected, menuOpen, index, total, onSelect, onUpdate, onRemove, onMove, onDuplicate, onMenu }: { block: EditorBlock; locale: Locale; selected: boolean; menuOpen: boolean; index: number; total: number; onSelect: () => void; onUpdate: (block: EditorBlock) => void; onRemove: () => void; onMove: (id: string, amount: number) => void; onDuplicate: () => void; onMenu: (open: boolean) => void }) {
  const l = labels[locale];
  const picker = useRef<InlineMediaUploadHandle>(null);
  const media = block.type === "image" || block.type === "pdf";
  const icon = block.type === "image" ? <ImageIcon size={15} /> : block.type === "pdf" ? <FileText size={15} /> : block.type === "source" ? <Quote size={15} /> : block.type === "subheading" ? <Type size={15} /> : block.type === "button" ? <Link2 size={15} /> : <Text size={15} />;
  const name = l[block.type === "paragraph" ? "paragraph" : block.type] as string;
  const setMedia = (value: { url: string; name?: string; mime?: string }) => media && onUpdate({ ...block, media: { ...block.media, ...value } } as MediaBlock);
  return <article className={"visual-block block-" + block.type + (selected ? " selected" : "")} onClick={onSelect}>
    <header><b>{icon}{name}</b>{media && block.media.url && <button type="button" className="icon-button block-replace" title={block.type === "image" ? l.replaceImage : l.replaceFile} aria-label={block.type === "image" ? l.replaceImage : l.replaceFile} onClick={(event) => { event.stopPropagation(); picker.current?.open(); }}><RefreshCw size={15} /></button>}<button type="button" className="icon-button" title={l.remove} aria-label={l.remove} onClick={(event) => { event.stopPropagation(); onRemove(); }}><X size={16} /></button><div className="block-actions"><button type="button" className="icon-button" title={l.actions} aria-label={l.actions} onClick={(event) => { event.stopPropagation(); onMenu(!menuOpen); }}><MoreHorizontal size={17} /></button>{menuOpen && <BlockMenu l={l} index={index} total={total} onMove={onMove} blockId={block.id} onDuplicate={onDuplicate} onRemove={onRemove} close={() => onMenu(false)} />}</div></header>
    {media ? <MediaEditor block={block as MediaBlock} l={l} picker={picker} onMedia={setMedia} onUpdate={onUpdate} /> : block.type === "button" ? <ButtonEditor block={block} locale={locale} onUpdate={onUpdate} /> : <TextEditor block={block as TextBlock} locale={locale} selected={selected} onUpdate={onUpdate} />}
  </article>;
}

function BlockMenu({ l, index, total, blockId, onMove, onDuplicate, onRemove, close }: { l: Record<string, string>; index: number; total: number; blockId: string; onMove: (id: string, amount: number) => void; onDuplicate: () => void; onRemove: () => void; close: () => void }) {
  useEffect(() => { const outside = (event: MouseEvent) => { if (!(event.target as Element).closest(".block-actions")) close(); }; const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); }; document.addEventListener("mousedown", outside); document.addEventListener("keydown", key); return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", key); }; }, [close]);
  const run = (action: () => void) => { action(); close(); };
  return <div className="block-popover" role="menu"><button disabled={index === 0} onClick={() => run(() => onMove(blockId, -1))}><ChevronUp size={15} />{l.moveUp}</button><button disabled={index === total - 1} onClick={() => run(() => onMove(blockId, 1))}><ChevronDown size={15} />{l.moveDown}</button><button onClick={() => run(onDuplicate)}><Copy size={15} />{l.duplicate}</button><button className="danger" onClick={() => run(onRemove)}><Trash2 size={15} />{l.remove}</button></div>;
}

function TextEditor({ block, locale, selected, onUpdate }: { block: TextBlock; locale: Locale; selected: boolean; onUpdate: (block: EditorBlock) => void }) {
  const l = labels[locale]; const style = block.style || {};
  const set = (patch: Partial<TextStyle>) => onUpdate({ ...block, style: { ...style, ...patch } });
  return <><textarea value={block[locale]} onChange={(event) => onUpdate({ ...block, [locale]: event.target.value })} rows={2} />
    {selected && <StyleControls l={l} style={style} onChange={set} />}</>;
}

function TitleControls({ l, style, onChange }: { l: Record<string, string>; style: TextStyle; onChange: (style: TextStyle) => void }) {
  return <div className="title-controls"><StyleControls l={l} style={style} onChange={(patch) => onChange({ ...style, ...patch })} /></div>;
}

function StyleControls({ l, style, onChange }: { l: Record<string, string>; style: TextStyle; onChange: (patch: Partial<TextStyle>) => void }) {
  return <div className="text-controls"><Segment l={l} label={l.align} value={style.align || "start"} choices={["start", "center", "end"]} onChange={(align) => onChange({ align: align as TextStyle["align"] })} /><Segment l={l} label={l.size} value={style.size || "normal"} choices={["small", "normal", "large", "heading"]} onChange={(size) => onChange({ size: size as TextStyle["size"] })} /><div className="format-buttons"><button type="button" className={style.bold ? "active" : ""} title={l.bold} aria-label={l.bold} onClick={() => onChange({ bold: !style.bold })}><Bold size={15} /></button><button type="button" className={style.underline ? "active" : ""} title={l.underline} aria-label={l.underline} onClick={() => onChange({ underline: !style.underline })}><Underline size={15} /></button></div></div>;
}

function Segment({ l, label, value, choices, onChange }: { l: Record<string, string>; label: string; value: string; choices: string[]; onChange: (value: string) => void }) {
  return <label className="editor-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{choices.map((choice) => <option key={choice} value={choice}>{l[choice]}</option>)}</select></label>;
}

function MediaEditor({ block, l, picker, onMedia, onUpdate }: { block: MediaBlock; l: Record<string, string>; picker: React.RefObject<InlineMediaUploadHandle | null>; onMedia: (value: { url: string; name?: string; mime?: string }) => void; onUpdate: (block: EditorBlock) => void }) {
  const updateMedia = (patch: Partial<MediaBlock["media"]>) => onUpdate({ ...block, media: { ...block.media, ...patch } });
  const image = block.type === "image";
  return <div className="block-media-editor"><InlineMediaUpload ref={picker} compact locale={l.edit === "עריכת כרטיס" ? "he" : "ar"} initial={block.type === "image" ? { imageUrl: block.media.url, fileName: block.media.name, mimeType: block.media.mime } : { fileUrl: block.media.url, fileName: block.media.name, mimeType: block.media.mime }} includeFields={false} onChange={onMedia} />
    {!block.media.url ? <button type="button" className="media-picker" onClick={() => picker.current?.open()}>{image ? <ImageIcon size={22} /> : <FileText size={22} />}<span>{image ? l.chooseImage : l.choosePdf}</span></button> : image ? <><img className={"visual-editor-media-thumb align-media-" + (block.media.align || "start")} src={block.media.url} alt="" /><div className="media-settings"><Segment l={l} label={l.width} value={block.media.width || "medium"} choices={["small", "medium", "large", "full"]} onChange={(width) => updateMedia({ width: width as MediaBlock["media"]["width"] })} /><Segment l={l} label={l.fit} value={block.media.fit || "cover"} choices={["cover", "contain"]} onChange={(fit) => updateMedia({ fit: fit as MediaBlock["media"]["fit"] })} /><Segment l={l} label={l.align} value={block.media.align || "start"} choices={["start", "center", "end"]} onChange={(align) => updateMedia({ align: align as MediaBlock["media"]["align"] })} /></div></> : <><div className="pdf-tile"><FileText size={24} /><span>{block.media.displayName || l.viewDocument}</span></div><label className="media-display-name">{l.displayName}<input value={block.media.displayName || ""} onChange={(event) => updateMedia({ displayName: event.target.value })} /></label></>}
  </div>;
}

function ButtonEditor({ block, locale, onUpdate }: { block: ButtonBlock; locale: Locale; onUpdate: (block: EditorBlock) => void }) {
  const l = labels[locale]; return <div className="button-block-fields"><label>{l.buttonText}<input value={block[locale]} onChange={(event) => onUpdate({ ...block, [locale]: event.target.value })} /></label><label>{l.destination}<input value={block.href} onChange={(event) => onUpdate({ ...block, href: event.target.value })} /></label></div>;
}

function Preview({ title, titleStyle, blocks, locale }: { title: string; titleStyle: TextStyle; blocks: EditorBlock[]; locale: Locale }) {
  const l = labels[locale]; const classes = "content-block text-" + (titleStyle.size || "heading") + " align-" + (titleStyle.align || "start") + (titleStyle.bold ? " is-bold" : "") + (titleStyle.underline ? " is-underlined" : ""); return <div className="visual-preview-card"><h3 className={classes}>{title || "—"}</h3>{blocks.map((block) => {
    if (block.type === "image") return block.media.url ? <img key={block.id} className={"preview-media-" + (block.media.width || "medium") + " align-media-" + (block.media.align || "start")} src={block.media.url} style={{ objectFit: block.media.fit || "cover" }} alt="" /> : null;
    if (block.type === "pdf") return block.media.url ? <div className="preview-document" key={block.id}><FileText size={18} />{block.media.displayName || l.viewDocument}</div> : null;
    if (block.type === "button") return block.href || block[locale] ? <span className="preview-button" key={block.id}>{block[locale] || l.button}</span> : null;
    const textBlock = block as TextBlock; const style = textBlock.style || {}; return <p key={textBlock.id} className={"content-block text-" + (style.size || "normal") + " align-" + (style.align || "start") + " space-" + (style.spacing || "normal") + (style.bold ? " is-bold" : "") + (style.underline ? " is-underlined" : "")}>{textBlock[locale]}</p>;
  })}</div>;
}
