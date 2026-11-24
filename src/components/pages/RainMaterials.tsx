"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { rainMaterials, type RainMaterial } from "./rain-materials";
import { DocumentPreview } from "@/components/worksheets/DocumentPreview";
import styles from "./RainMaterials.module.css";

const translations = {
  he: {
    stage: "שלב", open: "פתיחה בגודל מלא",
  },
  ar: {
    stage: "المرحلة", open: "عرض بالحجم الكامل",
  },
};

function MaterialCard({ item, locale }: { item: RainMaterial; locale: Locale }) {
  const copy = translations[locale];
  const [preview, setPreview] = useState(false);
  const path = `/letter-groups/rain/${item.id}`;
  const arabicMain = locale === "ar" && item.id === "main";
  const hebrewFallback = locale === "ar" && !arabicMain;
  const url = arabicMain ? "/letter-groups/rain-main.webp" : `${path}.webp`;
  return (
    <li className={styles.card}>
      <button type="button" className={`nav-action-control ${styles.cardLink}`} onClick={() => setPreview(true)}>
        {!hebrewFallback && <div className={styles.preview}>
          <Image src={arabicMain ? url : `${path}-preview.webp`} width={400} height={400} alt="" unoptimized />
        </div>}
        <div className={styles.cardCopy}>
          {item.stage && <span className={styles.stage}>{copy.stage} {item.stage}</span>}
          <h4>{item[locale]}</h4>
          <span className={styles.open}><Maximize2 size={15} aria-hidden="true" />{hebrewFallback ? "عرض النسخة العبرية" : copy.open}</span>
        </div>
      </button>
      {preview && <DocumentPreview locale={locale} title={item[locale]} url={url} onClose={() => setPreview(false)} />}
    </li>
  );
}

export function RainGuides({ locale }: { locale: Locale }) {
  return (
    <div className={styles.library}>
      {locale === "ar" && <p className={styles.sourceLanguage}>تتضمّن المواد الأصلية تعليمات بالعبرية.</p>}
      <ul className={styles.grid}>
        {rainMaterials.filter((item) => item.kind === "guide").map((item) =>
          <MaterialCard key={item.id} item={item} locale={locale} />)}
      </ul>
    </div>
  );
}
