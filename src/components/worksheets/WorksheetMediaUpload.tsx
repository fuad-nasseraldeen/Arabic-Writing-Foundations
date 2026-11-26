"use client";

import { useRef, useState } from "react";
import { FileText, FileUp, ImageIcon, Replace, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import { worksheetBucket } from "@/lib/worksheet-storage";

type Props = { locale: Locale; name: string; initialUrl?: string | null; initialName?: string | null; imagesOnly?: boolean };
const imageTypes = ["image/jpeg", "image/png", "image/webp"];

export function WorksheetMediaUpload({ locale, name, initialUrl, initialName, imagesOnly = false }: Props) {
  const [url, setUrl] = useState(initialUrl || ""), [fileName, setFileName] = useState(initialName || ""), [type, setType] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const privateFile = name === "file_url";
  const isPdf = type === "application/pdf" || url.toLowerCase().includes(".pdf");
  const upload = async (file: File) => {
    const valid = imageTypes.includes(file.type) || (!imagesOnly && file.type === "application/pdf");
    const maximum = file.type === "application/pdf" ? 25 : 10;
    if (!valid || file.size > maximum * 1024 * 1024) { setError(locale === "he" ? "אפשר להעלות תמונה עד 10MB או PDF עד 25MB." : "يمكن رفع صورة حتى 10MB أو PDF حتى 25MB."); return; }
    setBusy(true); setError("");
    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[file.type];
    const path = `${privateFile ? "worksheets" : "worksheet-thumbnails"}/${crypto.randomUUID()}.${extension}`;
    const supabase = createClient();
    const bucket = supabase.storage.from(privateFile ? worksheetBucket : "site-media");
    const { error: uploadError } = await bucket.upload(path, file, {
      contentType: file.type,
      ...(privateFile && { cacheControl: "0" }),
    });
    if (uploadError) { setError(uploadError.message); setBusy(false); return; }
    if (privateFile) {
      setUrl(path); setFileName(file.name); setType(file.type); setBusy(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const media = await supabase.from("media").insert({ storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size, uploaded_by: user?.id });
    if (media.error) { await bucket.remove([path]); setError(media.error.message); setBusy(false); return; }
    const { data } = bucket.getPublicUrl(path);
    setUrl(data.publicUrl); setFileName(file.name); setType(file.type); setBusy(false);
  };
  const copy = locale === "he" ? { upload: "הוספת קובץ", replace: "החלפת קובץ", remove: "הסרת קובץ" } : { upload: "إضافة ملف", replace: "استبدال الملف", remove: "إزالة الملف" };
  return <div className="worksheet-upload"><input type="hidden" name={name} value={url} /><input type="hidden" name={`${name}_file_name`} value={fileName} /><input type="hidden" name={`${name}_mime`} value={type} /><input ref={input} className="visually-hidden" type="file" accept={imagesOnly ? ".jpg,.jpeg,.png,.webp" : ".jpg,.jpeg,.png,.webp,.pdf"} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); }} />
    {url ? <div className="worksheet-upload-preview">{isPdf ? <FileText size={28} /> : privateFile ? <ImageIcon size={28} /> : <img src={url} alt="" />}<span><b>{fileName || (isPdf ? "PDF" : "Image")}</b><small>{isPdf ? "PDF" : locale === "he" ? "תמונה" : "صورة"}</small></span><button type="button" disabled={busy} onClick={() => input.current?.click()} aria-label={copy.replace}><Replace size={16} /></button><button type="button" disabled={busy} onClick={() => { setUrl(""); setFileName(""); setType(""); }} aria-label={copy.remove}><X size={16} /></button></div> : <button type="button" className="file-upload-button" disabled={busy} onClick={() => input.current?.click()}><FileUp size={17} />{busy ? (locale === "he" ? "מעלה קובץ…" : "جارٍ الرفع…") : copy.upload}</button>}{error && <small className="form-error">{error}</small>}</div>;
}
