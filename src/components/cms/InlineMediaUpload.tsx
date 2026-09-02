"use client";

import { useRef, useState } from "react";
import { FileText, FileUp, ImageIcon, Replace, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";

const bucket = "site-media";
const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const labels = (locale: Locale) =>
  locale === "he"
    ? {
        upload: "הוספת קובץ",
        replace: "החלפת קובץ",
        remove: "הסרת קובץ",
        image: "תמונה",
        pdf: "מסמך PDF",
      }
    : {
        upload: "إضافة ملف",
        replace: "استبدال الملف",
        remove: "إزالة الملف",
        image: "صورة",
        pdf: "مستند PDF",
      };

export function InlineMediaUpload({
  locale,
  initial,
  onChange,
  includeFields = true,
}: {
  locale: Locale;
  initial: {
    imageUrl?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
  };
  onChange?: (media: { url: string; name: string; mime: string }) => void;
  includeFields?: boolean;
}) {
  const initialUrl = initial.imageUrl || initial.fileUrl || "";
  const [url, setUrl] = useState(initialUrl);
  const [name, setName] = useState(initial.fileName || "");
  const [mime, setMime] = useState(
    initial.mimeType ||
      (initial.fileUrl || initial.imageUrl?.toLowerCase().includes(".pdf")
        ? "application/pdf"
        : ""),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const copy = labels(locale);
  const isPdf = mime === "application/pdf";
  const upload = async (file: File) => {
    const valid =
      imageTypes.includes(file.type) || file.type === "application/pdf";
    const limit = file.type === "application/pdf" ? 25 : 10;
    if (!valid || file.size > limit * 1024 * 1024) {
      setError(
        locale === "he"
          ? "אפשר להעלות JPG, PNG, WEBP עד 10MB או PDF עד 25MB."
          : "يمكن رفع JPG أو PNG أو WEBP حتى 10MB أو PDF حتى 25MB.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `inline/${Date.now()}-${crypto.randomUUID()}-${safe}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setError(uploadError.message);
      setBusy(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const mediaResult = await supabase.from("media").insert({
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user?.id,
    });
    if (mediaResult.error) {
      setError(mediaResult.error.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setUrl(data.publicUrl);
    setName(file.name);
    setMime(file.type);
    onChange?.({ url: data.publicUrl, name: file.name, mime: file.type });
    setBusy(false);
  };
  const remove = () => {
    setUrl("");
    setName("");
    setMime("");
    onChange?.({ url: "", name: "", mime: "" });
    if (input.current) input.current.value = "";
  };
  return (
    <div className="inline-media-field">
      {includeFields && (
        <>
          <input type="hidden" name="image_url" value={!isPdf ? url : ""} />
          <input type="hidden" name="file_url" value={isPdf ? url : ""} />
          <input type="hidden" name="original_file_name" value={name} />
          <input type="hidden" name="media_mime_type" value={mime} />
        </>
      )}
      <input
        ref={input}
        className="visually-hidden"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />
      {url ? (
        <div className="editor-media-preview">
          {isPdf ? (
            <FileText size={32} aria-hidden="true" />
          ) : (
            <img src={url} alt="" />
          )}
          <div>
            <b>{name}</b>
            <small>{isPdf ? copy.pdf : copy.image}</small>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => input.current?.click()}
            disabled={busy}
            aria-label={copy.replace}
          >
            <Replace size={17} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={remove}
            aria-label={copy.remove}
          >
            <X size={17} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="file-upload-button"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          <FileUp size={18} />
          {busy
            ? locale === "he"
              ? "מעלה קובץ…"
              : "جارٍ الرفع…"
            : copy.upload}
        </button>
      )}
      {error && <small className="form-error">{error}</small>}
    </div>
  );
}
