"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, CloudRain, FilePenLine, Lightbulb, Maximize2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { rainMaterials, type RainMaterial } from "./rain-materials";
import { DocumentPreview } from "@/components/worksheets/DocumentPreview";
import styles from "./RainMaterials.module.css";

const translations = {
  he: {
    guide: "חומר והנחיות", ideas: "רעיונות לפעילויות", worksheet: "דפי עבודה", story: "סיפור",
    stage: "שלב", open: "פתיחה בגודל מלא", instruction: "בחרו חומר לעיון או דף עבודה לפתיחה ולהדפסה.",
  },
  ar: {
    guide: "مواد وإرشادات", ideas: "أفكار للأنشطة", worksheet: "أوراق عمل", story: "القصة",
    stage: "المرحلة", open: "عرض بالحجم الكامل", instruction: "اختاروا مادة للاطلاع عليها أو ورقة عمل لفتحها وطباعتها.",
  },
};

const sections = [
  ["guide", BookOpen],
  ["ideas", Lightbulb],
  ["worksheet", FilePenLine],
  ["story", CloudRain],
] as const;

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

export function RainMaterials({ locale, story }: { locale: Locale; story: ReactNode }) {
  const copy = translations[locale];
  const [active, setActive] = useState<"guide" | "ideas" | "story">("guide");
  const visible = rainMaterials.filter((item) => item.kind === active);

  return (
    <div className={styles.library}>
      <p className={styles.instruction}>{copy.instruction}</p>
      <div className={styles.sections} role="group" aria-label={locale === "he" ? "סוג החומר" : "نوع المادة"}>
        {sections.map(([id, Icon]) => id === "worksheet" ? (
          <Link key={id} className={styles.section} href={`/${locale}/worksheets?letter-group=rain`}>
            <Icon size={20} aria-hidden="true" />{copy[id]}
          </Link>
        ) : (
          <button key={id} type="button" className={`nav-action-control ${styles.section}`}
            aria-pressed={active === id} onClick={() => setActive(id)}>
            <Icon size={20} aria-hidden="true" />{copy[id]}
          </button>
        ))}
      </div>
      {active === "story" ? story : (
        <section aria-labelledby="rain-material-heading">
          <h3 className={styles.heading} id="rain-material-heading">{copy[active]}</h3>
          {locale === "ar" && <p className={styles.sourceLanguage}>تتضمّن المواد الأصلية تعليمات بالعبرية.</p>}
          <ul className={styles.grid}>
            {visible.map((item) => <MaterialCard key={item.id} item={item} locale={locale} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
