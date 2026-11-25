"use client";

import { Download, Printer, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import styles from "./DocumentPreview.module.css";

export function DocumentPreviewButton({ children, className, locale, title, url, pdf = true }: {
  children: ReactNode;
  className?: string;
  locale: Locale;
  title: string;
  url: string;
  pdf?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`nav-action-control ${className || ""}`} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && <DocumentPreview locale={locale} title={title} url={url} pdf={pdf} onClose={() => setOpen(false)} />}
    </>
  );
}

export function DocumentPreview({ locale, title, url, pdf, onClose }: {
  locale: Locale;
  title: string;
  url: string;
  pdf?: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const he = locale === "he";
  const downloadLabel = he ? "הורדת PDF" : "تنزيل PDF";

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  async function downloadImagePdf() {
    if (!image.current?.naturalWidth || downloading) return;
    let source = image.current;
    setDownloading(true);
    setDownloadFailed(false);
    try {
      const sourceUrl = new URL(source.currentSrc, window.location.href);
      if (sourceUrl.origin !== window.location.origin) {
        source = new window.Image();
        source.crossOrigin = "anonymous";
        source.src = sourceUrl.href;
        await source.decode();
      }
      const { imageToPdf } = await import("./image-pdf");
      const objectUrl = URL.createObjectURL(await imageToPdf(source));
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = (sourceUrl.pathname.split("/").pop()?.replace(/\.[^.]+$/, "") || "document") + ".pdf";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  function print() {
    if (pdf) {
      const documentWindow = frame.current?.contentWindow;
      try {
        documentWindow?.focus();
        documentWindow?.print();
      } catch {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return;
    }
    if (!image.current?.naturalWidth) return;

    const printer = document.createElement("iframe");
    printer.className = styles.printer;
    printer.title = he ? "הדפסה" : "طباعة";
    printer.setAttribute("aria-hidden", "true");
    document.body.append(printer);
    const printWindow = printer.contentWindow;
    const printDocument = printer.contentDocument;
    if (!printWindow || !printDocument) {
      printer.remove();
      return;
    }
    const sheet = printDocument.createElement("img");
    const style = printDocument.createElement("style");
    style.textContent = "@page{margin:8mm}html,body{margin:0}img{display:block;width:100%;height:calc(100vh - 1px);object-fit:contain;break-inside:avoid}";
    printDocument.head.append(style);
    printDocument.title = title;
    sheet.onload = () => {
      printWindow.addEventListener("afterprint", () => printer.remove(), { once: true });
      printWindow.focus();
      printWindow.print();
    };
    sheet.onerror = () => printer.remove();
    printDocument.body.append(sheet);
    sheet.src = image.current.currentSrc;
  }

  return (
    <dialog ref={dialog} className={styles.dialog} aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={styles.card}>
        <header className={styles.header}>
          <strong>{title}</strong>
          <div className={styles.actions}>
            {pdf ? (
              <a href={url} download><Download size={17} aria-hidden="true" />{downloadLabel}</a>
            ) : (
              <button type="button" disabled={!ready || downloading} onClick={downloadImagePdf}>
                <Download size={17} aria-hidden="true" />
                {downloading ? (he ? "מכין PDF…" : "جارٍ إعداد PDF…") : downloadLabel}
              </button>
            )}
            <button type="button" disabled={!ready} onClick={print}><Printer size={17} aria-hidden="true" />{he ? "הדפסה" : "طباعة"}</button>
            <button type="button" onClick={onClose} aria-label={he ? "סגירה" : "إغلاق"}><X size={21} /></button>
          </div>
          {downloadFailed && (
            <span role="alert">{he ? "לא ניתן להוריד כ־PDF. אפשר לשמור כ־PDF דרך כפתור ההדפסה." : "تعذّر تنزيل PDF. يمكن حفظه بصيغة PDF من خلال زر الطباعة."}</span>
          )}
        </header>
        <div className={styles.document}>
          {pdf
            ? <iframe ref={frame} src={url.includes("#") ? url : `${url}#view=Fit`} title={title} onLoad={() => setReady(true)} />
            : <img ref={image} src={url} alt={title} onLoad={() => setReady(true)} />}
        </div>
      </div>
    </dialog>
  );
}
