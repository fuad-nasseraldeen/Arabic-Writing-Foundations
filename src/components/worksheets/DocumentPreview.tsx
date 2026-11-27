"use client";

import { Printer, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import styles from "./DocumentPreview.module.css";

export function DocumentPreview({ locale, title, url, pdf, onClose, autoPrint = false, status, groupPrint = false }: {
  locale: Locale;
  title: string;
  url?: string;
  pdf?: boolean;
  onClose: () => void;
  autoPrint?: boolean;
  status?: ReactNode;
  groupPrint?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const didAutoPrint = useRef(false);
  const [ready, setReady] = useState(false);
  const [documentFailed, setDocumentFailed] = useState(false);
  const [printPages, setPrintPages] = useState<string[]>();
  const [pagesReady, setPagesReady] = useState(false);
  const usePrintPages = groupPrint && typeof window !== "undefined" &&
    (window.matchMedia("(pointer: coarse)").matches || navigator.pdfViewerEnabled === false);
  const he = locale === "he";

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

  useEffect(() => {
    if (!usePrintPages || !url) return;
    const controller = new AbortController();
    const pages: string[] = [];
    void import("./render-print-pages").then(({ renderPrintPages }) =>
      renderPrintPages(url, controller.signal, (blob) => {
        pages.push(URL.createObjectURL(blob));
        setPrintPages([...pages]);
      }),
    ).then(() => {
      if (!controller.signal.aborted) setPagesReady(true);
    }).catch(() => {
      if (!controller.signal.aborted) setDocumentFailed(true);
    });
    return () => {
      controller.abort();
      pages.forEach((page) => URL.revokeObjectURL(page));
    };
  }, [url, usePrintPages]);

  function print() {
    if (usePrintPages) {
      window.print();
      return;
    }
    if (pdf) {
      const documentWindow = frame.current?.contentWindow;
      try {
        documentWindow?.focus();
        documentWindow?.print();
      } catch {
        setDocumentFailed(true);
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
    style.textContent = "@media print{@page{margin:8mm}html,body{margin:0}img{display:block;width:100%;height:calc(100vh - 1px);object-fit:contain;break-inside:avoid}}";
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

  function documentReady() {
    setReady(true);
    if (autoPrint && !didAutoPrint.current) {
      didAutoPrint.current = true;
      print();
    }
  }

  return (
    <><dialog ref={dialog} className={styles.dialog} aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={styles.card}>
        <header className={styles.header}>
          <strong>{title}</strong>
          <div className={styles.actions}>
            <button type="button" disabled={usePrintPages ? !pagesReady : !ready} onClick={print}><Printer size={17} aria-hidden="true" />{he ? "הדפסה" : "طباعة"}</button>
            <button type="button" onClick={onClose} aria-label={he ? "סגירה" : "إغلاق"}><X size={21} /></button>
          </div>
          {usePrintPages && pagesReady && <small className={styles.printHint}>{he
            ? "אם חלון ההדפסה לא נפתח, בחרו ״הדפסה״ בתפריט הדפדפן."
            : "إذا لم تفتح نافذة الطباعة، اختاروا «طباعة» من قائمة المتصفح."}</small>}
          {documentFailed && <span role="alert">{he ? "לא ניתן לפתוח את דף העבודה כרגע." : "تعذر فتح ورقة العمل حالياً."}</span>}
        </header>
        <div className={styles.document}>
          {url && usePrintPages ? (
            <div className={styles.pageList}>
              {!pagesReady && !documentFailed && <p className={styles.status} role="status">{he ? "מכין את כל דפי הקבוצה להדפסה…" : "جارٍ إعداد جميع صفحات المجموعة للطباعة…"}</p>}
              {printPages?.map((page, index) => <img key={page} src={page} alt={he ? `עמוד ${index + 1}` : `صفحة ${index + 1}`} />)}
            </div>
          ) : url ? (pdf
            ? <iframe ref={frame} src={url.includes("#") ? url : `${url}#view=Fit&toolbar=0`} title={title} onLoad={documentReady} />
            : <img ref={image} src={url} alt={title} onLoad={documentReady} onError={() => setDocumentFailed(true)} />)
            : status && <div className={styles.status}>{status}</div>}
        </div>
      </div>
    </dialog>
    {usePrintPages && pagesReady && createPortal(
      <div className={styles.printPages} aria-hidden="true">
        {printPages?.map((page) => <img key={page} src={page} alt="" />)}
      </div>,
      document.body,
    )}</>
  );
}
