import type { ReactNode } from "react";
import Image from "next/image";
import { ProtectedWorksheetButton } from "@/components/worksheets/ProtectedWorksheet";
import type { Locale } from "@/i18n/config";
import { LetterReadingPage } from "./LetterReadingPage";
import { groupMaterials, type GroupMaterial } from "./group-materials";
import { rainStages } from "./rain-materials";
import styles from "./LetterGroupsPage.module.css";

type GroupId = keyof typeof groupMaterials;

function MaterialPage({ item, group, locale, title = item[locale] }: {
  item: GroupMaterial;
  group: GroupId;
  locale: Locale;
  title?: string;
}) {
  const document = `/letter-groups/${group}/${item.id}.webp`;
  if (item.kind === "worksheet") {
    return <figure className={locale === "he" ? styles.readerPage : styles.readerLinkPage}>
      <ProtectedWorksheetButton id={`${group}-${item.id}`} locale={locale} title={title}
        className={`nav-action-control ${styles.readerOpen}`}>
        {locale === "he" && <Image src={`/letter-groups/${group}/${item.id}-preview.webp`} alt=""
          width={560} height={790} sizes="(max-width: 700px) 92vw, 560px" unoptimized />}
        <span>{title}</span>
      </ProtectedWorksheetButton>
    </figure>;
  }
  return (
    <LetterReadingPage locale={locale} document={document}
      title={locale === "he" ? title : `${title} · عرض بالعبرية`}
      image={locale === "he" ? document : undefined} />
  );
}

export function GroupReadingSequence({ group, locale, main, story }: {
  group: GroupId;
  locale: Locale;
  main: ReactNode;
  story: ReactNode;
}) {
  const he = locale === "he";
  const materials = groupMaterials[group];
  const intro = materials.filter(({ id }) => id.startsWith("introduction-"));

  return (
    <>
      <nav className={styles.readerActions} aria-label={he ? "ניווט בקבוצה" : "التنقل في المجموعة"}>
        <a href={`#${group}-intro`}>{he ? "דפי היכרות" : "صفحات التعريف"}</a>
        <a href={`#${group}-main`}>{he ? "דף ראשי" : "الصفحة الرئيسية"}</a>
        <a href={`#${group}-stories`}>{he ? "סיפורי הדמיה" : "قصص تخيّلية"}</a>
        {rainStages.map((_, index) => (
          <a key={index} href={`#${group}-stage-${index + 1}`}>{he ? "שלב" : "المرحلة"} {index + 1}</a>
        ))}
      </nav>
      <section id={`${group}-intro`} className={styles.readerSection}>
        <h3>{he ? "דפי היכרות" : "صفحات التعريف"}</h3>
        {intro.map((item) => <MaterialPage key={item.id} item={item} group={group} locale={locale} />)}
      </section>
      <section id={`${group}-main`} className={styles.readerSection}>
        <h3>{he ? "דף ראשי" : "الصفحة الرئيسية"}</h3>
        {main}
      </section>
      <section id={`${group}-stories`} className={styles.readerSection}>
        <h3>{he ? "סיפורי הדמיה" : "قصص تخيّلية"}</h3>
        {story}
      </section>
      {rainStages.map((title, index) => {
        const stage = index + 1;
        const items = materials.filter((item) => item.stage === stage);
        return (
          <section key={stage} id={`${group}-stage-${stage}`} className={styles.readerSection}>
            <h3>{he ? "שלב" : "المرحلة"} {stage} · {title[locale]}</h3>
            {items.filter((item) => item.kind === "guide").map((item) =>
              <MaterialPage key={item.id} item={item} group={group} locale={locale}
                title={he ? `הנחיות · ${item.he}` : `إرشادات · ${item.ar}`} />)}
            {items.filter((item) => item.kind === "ideas").map((item) =>
              <MaterialPage key={item.id} item={item} group={group} locale={locale}
                title={he ? "רעיונות לפעילויות הכנה" : "أفكار لأنشطة تمهيدية"} />)}
            <div className={styles.readerSectionHeader}>
              <h4>{he ? "דפי עבודה" : "أوراق عمل"}</h4>
            </div>
            {items.filter((item) => item.kind === "worksheet").map((item) =>
              <MaterialPage key={item.id} item={item} group={group} locale={locale} />)}
          </section>
        );
      })}
    </>
  );
}
