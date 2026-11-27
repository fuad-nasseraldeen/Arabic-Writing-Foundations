"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { DocumentPreview } from "./DocumentPreview";

type FileResult = { blob: Blob; pdf: boolean } | "login_required" | "unavailable";
type SignedFile = { url: string; pdf: boolean };

async function loadFile({ url, pdf }: SignedFile) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Document unavailable");
  const blob = await response.blob();
  return { blob: pdf ? new Blob([blob], { type: "application/pdf" }) : blob, pdf };
}

async function requestWorksheet(id: string, locale: Locale): Promise<FileResult> {
  try {
    const access = await fetch(`/api/worksheets/${encodeURIComponent(id)}?locale=${locale}`, { cache: "no-store" });
    if (access.status === 401) return "login_required";
    if (!access.ok) return "unavailable";
    const type = access.headers.get("Content-Type");
    if (type?.startsWith("image/") || type === "application/pdf") {
      return { blob: await access.blob(), pdf: type === "application/pdf" };
    }
    // Keep the bytes in this viewer so print works after the signed URL expires.
    // The same-origin blob also lets us print through the browser's PDF frame.
    const file = await access.json() as SignedFile | { documents: SignedFile[] };
    if ("documents" in file) {
      const [documents, { createGroupPrintPdf }] = await Promise.all([
        Promise.all(file.documents.map(loadFile)),
        import("./group-print-pdf"),
      ]);
      return { blob: await createGroupPrintPdf(documents), pdf: true };
    }
    return await loadFile(file);
  } catch {
    return "unavailable";
  }
}

function WorksheetViewer({ request, locale, title, autoPrint, close }: {
  request: Promise<FileResult>;
  locale: Locale;
  title: string;
  autoPrint: boolean;
  close: () => void;
}) {
  const [result, setResult] = useState<{ url: string; pdf: boolean } | "login_required" | "unavailable">();
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    void request.then((file) => {
      if (!active) return;
      if (typeof file === "string") {
        setResult(file);
      } else {
        objectUrl = URL.createObjectURL(file.blob);
        setResult({ url: objectUrl, pdf: file.pdf });
      }
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [request]);

  const he = locale === "he";
  const file = typeof result === "object" ? result : undefined;
  const status = result === "login_required" ? (
    <p role="status">{he ? "יש להתחבר כדי לפתוח את דף העבודה." : "سجّلوا الدخول لفتح ورقة العمل."}{" "}
      <Link href={`/${locale}/login`}>{he ? "התחברות" : "تسجيل الدخول"}</Link>
    </p>
  ) : result === "unavailable" ? (
    <p role="alert">{he ? "לא ניתן לפתוח את דף העבודה כרגע." : "تعذر فتح ورقة العمل حالياً."}</p>
  ) : <p role="status">{he ? "דף העבודה נטען…" : "جارٍ تحميل ورقة العمل…"}</p>;

  return <DocumentPreview autoPrint={autoPrint} locale={locale} title={title}
    url={file?.url} pdf={file?.pdf} status={status} onClose={close} />;
}

export function useWorksheetViewer(locale: Locale) {
  const [selection, setSelection] = useState<{ request: Promise<FileResult>; title: string; autoPrint: boolean }>();
  function open(id: string, title: string, autoPrint = false) {
    setSelection({ request: requestWorksheet(id, locale), title, autoPrint });
  }
  const viewer = selection && <WorksheetViewer {...selection} locale={locale} close={() => setSelection(undefined)} />;
  return { open, viewer };
}

export function ProtectedWorksheetButton({ id, title, locale, className, children, autoPrint = false }: {
  id: string;
  title: string;
  locale: Locale;
  className?: string;
  children: ReactNode;
  autoPrint?: boolean;
}) {
  const { open, viewer } = useWorksheetViewer(locale);
  return <>
    <button type="button" className={className} onClick={() => open(id, title, autoPrint)}>{children}</button>
    {viewer}
  </>;
}
