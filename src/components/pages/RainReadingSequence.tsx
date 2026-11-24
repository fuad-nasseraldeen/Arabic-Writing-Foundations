import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { LetterReadingPage } from "./LetterReadingPage";
import { rainMaterials, rainStages, type RainMaterial } from "./rain-materials";
import styles from "./LetterGroupsPage.module.css";

function RainPage({ item, locale, title = item[locale] }: {
  item: RainMaterial;
  locale: Locale;
  title?: string;
}) {
  const document = `/letter-groups/rain/${item.id}.webp`;
  return (
    <LetterReadingPage locale={locale} document={document}
      title={locale === "he" ? title : `${title} · عرض بالعبرية`}
      image={locale === "he" ? document : undefined} />
  );
}

export function RainReadingSequence({ locale, main, story }: {
  locale: Locale;
  main: ReactNode;
  story: ReactNode;
}) {
  const he = locale === "he";
  const worksheets = `/${locale}/worksheets?letter-group=rain`;
  const intro = rainMaterials.filter(({ id }) => id.startsWith("introduction-"));

  return (
    <>
      <nav className={styles.readerActions} aria-label={he ? "ניווט בקבוצת הגשם" : "التنقل في مجموعة المطر"}>
        <a href="#rain-intro">{he ? "דפי היכרות" : "صفحات التعريف"}</a>
        <a href="#rain-main">{he ? "דף ראשי" : "الصفحة الرئيسية"}</a>
        <a href="#rain-stories">{he ? "סיפורי הדמיה" : "قصص تخيّلية"}</a>
        <Link href={worksheets}>{he ? "דפי עבודה" : "أوراق عمل"}</Link>
        {rainStages.map((_, index) => (
          <a key={index} href={`#rain-stage-${index + 1}`}>{he ? "שלב" : "المرحلة"} {index + 1}</a>
        ))}
      </nav>
      <section id="rain-intro" className={styles.readerSection}>
        <h3>{he ? "דפי היכרות" : "صفحات التعريف"}</h3>
        {intro.map((item) => <RainPage key={item.id} item={item} locale={locale} />)}
      </section>
      <section id="rain-main" className={styles.readerSection}>
        <h3>{he ? "דף ראשי" : "الصفحة الرئيسية"}</h3>
        {main}
      </section>
      <section id="rain-stories" className={styles.readerSection}>
        <h3>{he ? "סיפורי הדמיה" : "قصص تخيّلية"}</h3>
        {story}
      </section>
      {rainStages.map((title, index) => {
        const stage = index + 1;
        const items = rainMaterials.filter((item) => item.stage === stage);
        return (
          <section key={stage} id={`rain-stage-${stage}`} className={styles.readerSection}>
            <h3>{he ? "שלב" : "المرحلة"} {stage} · {title[locale]}</h3>
            {items.filter((item) => item.kind === "guide").map((item) =>
              <RainPage key={item.id} item={item} locale={locale}
                title={he ? `הנחיות · ${item.he}` : `إرشادات · ${item.ar}`} />)}
            {items.filter((item) => item.kind === "ideas").map((item) =>
              <RainPage key={item.id} item={item} locale={locale}
                title={he ? "רעיונות לפעילויות הכנה" : "أفكار لأنشطة تمهيدية"} />)}
            <div className={styles.readerSectionHeader}>
              <h4>{he ? "דפי עבודה" : "أوراق عمل"}</h4>
              <Link className={styles.readerShortcut} href={`${worksheets}&stage=${stage}`}>
                {he ? "לדפי העבודה של השלב" : "أوراق عمل هذه المرحلة"}
              </Link>
            </div>
            {items.filter((item) => item.kind === "worksheet").map((item) =>
              <RainPage key={item.id} item={item} locale={locale} />)}
          </section>
        );
      })}
    </>
  );
}
