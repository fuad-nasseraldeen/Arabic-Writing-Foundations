import Link from "next/link";
import { InlineSectionEditor } from "@/components/cms/InlineSectionEditor";
import { PageIntro } from "@/components/layout/PageIntro";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
import { getPageCms, local } from "@/lib/cms";
import { LetterReadingPage } from "./LetterReadingPage";
import { RainReadingSequence } from "./RainReadingSequence";
import { LetterGroupSearch } from "./LetterGroupSearch";
import styles from "./LetterGroupsPage.module.css";

const groups = [
  { id: "rain", he: "קבוצת הגשם", ar: "مجموعة المطر" },
  { id: "wheel", he: "קבוצת הגלגל", ar: "مجموعة العجلة" },
  { id: "soup", he: "קבוצת המרקיה", ar: "مجموعة صحن الشوربة" },
  { id: "slide", he: "קבוצת המגלשה", ar: "مجموعة الزحليقة" },
  { id: "butterfly", he: "קבוצת הפרפר", ar: "مجموعة الفراشة" },
  { id: "egg", he: "קבוצת הביצה", ar: "مجموعة البيضة" },
  { id: "overview", he: "סיכום כל הקבוצות", ar: "ملخص مجموعات الحروف" },
] as const;

export async function LetterGroupsPage({
  locale,
  groupId,
  isAdmin,
}: {
  locale: Locale;
  groupId?: string | string[];
  isAdmin: boolean;
}) {
  const group = groups.find(({ id }) => id === groupId);
  const { sections: [section] } = await getPageCms("letters", isAdmin);
  const title = (section && local(section, "title", locale)) || t(locale).nav.letters;
  const isHe = locale === "he";
  const root = `/${locale}/letters`;
  const media = isHe ? "/letter-groups/he" : "/letter-groups";
  const storyLabel = isHe ? "סיפורי הדמיה" : "قصص تخيّلية";
  const allLabel = isHe ? "כל הקבוצות ברצף" : "كل المجموعات بالتسلسل";
  const firstPage = isHe ? "דף ראשי" : "الصفحة الرئيسية";
  const readingGroups = group ? [group] : groups;

  return (
    <div className="page-shell container cms-section content-page">
      {isAdmin && section && <InlineSectionEditor locale={locale} section={section} />}
      <PageIntro
        title={title}
        eyebrow={isHe ? "המדריך המקצועי" : "الدليل المهني"}
        description={section ? local(section, "subtitle", locale) : undefined}
      />
      <nav className={styles.breadcrumb} aria-label={isHe ? "ניווט עמוד" : "تنقل الصفحة"}>
        <Link className="text-nav-action" href={`/${locale}`}>
          {isHe ? "דף הבית" : "الصفحة الرئيسية"}
        </Link>
        <span aria-hidden="true">‹</span>
        {group ? (
          <>
            <Link className="text-nav-action" href={root}>{title}</Link>
            <span aria-hidden="true">‹</span>
            <span aria-current="page">{group[locale]}</span>
          </>
        ) : <span aria-current="page">{title}</span>}
      </nav>
      <LetterGroupSearch locale={locale} groups={groups} />
      <nav className={styles.readerActions} aria-label={isHe ? "בחירת קבוצה" : "اختيار المجموعة"}>
        {group && <Link href={root}>{allLabel}</Link>}
        {!group && <Link href={`/${locale}/worksheets`}>{isHe ? "דפי עבודה" : "أوراق عمل"}</Link>}
        {groups.map((item) => (
          <Link key={item.id} href={`${root}?group=${item.id}`}
            aria-current={group?.id === item.id ? "page" : undefined}>
            {item[locale]}
          </Link>
        ))}
      </nav>
      {!group && <h2 className={styles.readerTitle}>{allLabel}</h2>}
      <div className={styles.reader}>
        {readingGroups.map((item) => {
          const headingId = `group-${item.id}`;
          const main = <LetterReadingPage locale={locale} title={firstPage}
            image={`${media}/${item.id}-main.webp`} />;
          const story = <LetterReadingPage locale={locale} title={storyLabel}
            image={`${media}/${item.id}-story.webp`} document={`${media}/${item.id}-story.pdf`} />;
          return (
            <section key={item.id} className={styles.readerGroup} aria-labelledby={headingId}>
              <h2 className={styles.heading} id={headingId}>{item[locale]}</h2>
              {item.id === "overview" ? (
                <LetterReadingPage locale={locale} title={item[locale]}
                  image={`${media}/overview.webp`} document={`${media}/overview.pdf`} />
              ) : item.id === "rain" ? (
                <RainReadingSequence locale={locale} main={main} story={story} />
              ) : <>{main}{story}</>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
