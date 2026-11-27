import Link from "next/link";
import { InlineSectionEditor } from "@/components/cms/InlineSectionEditor";
import { PageIntro } from "@/components/layout/PageIntro";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
import { getPageCms, local } from "@/lib/cms";
import { LetterReadingPage } from "./LetterReadingPage";
import { GroupReadingSequence } from "./GroupReadingSequence";
import { letterGroups } from "./group-materials";
import { LetterGroupSearch } from "./LetterGroupSearch";
import { ArabicLetterSearch } from "./ArabicLetterSearch";
import { LetterBackToTop } from "./LetterBackToTop";
import { rainStages } from "./rain-materials";
import styles from "./LetterGroupsPage.module.css";

const groups = [
  ...letterGroups,
  { id: "overview", he: "סיכום כל הקבוצות", ar: "ملخص مجموعات الحروف" },
] as const;

export async function LetterGroupsPage({
  locale,
  groupId,
  view,
  isAdmin,
}: {
  locale: Locale;
  groupId?: string | string[];
  view?: string | string[];
  isAdmin: boolean;
}) {
  const byLetter = view === "letter";
  const group = byLetter ? undefined : groups.find(({ id }) => id === groupId);
  const { sections: [section] } = await getPageCms("letters", isAdmin);
  const title = (section && local(section, "title", locale)) || t(locale).nav.letters;
  const isHe = locale === "he";
  const root = `/${locale}/letters`;
  const byGroup = view === "group";
  const byStage = view === "stage";
  const fullView = !byLetter && !byGroup && !byStage;
  const viewRoot = fullView ? root : `${root}?view=${view}`;
  const viewTitle = byLetter ? t(locale).home.byLetter : byGroup ? t(locale).home.byGroup : byStage ? t(locale).home.byStage : title;
  const media = isHe ? "/letter-groups/he" : "/letter-groups";
  const storyLabel = isHe ? "סיפורי הדמיה" : "قصص تخيّلية";
  const allLabel = isHe ? "כל הקבוצות ברצף" : "كل المجموعات بالتسلسل";
  const firstPage = isHe ? "דף ראשי" : "الصفحة الرئيسية";
  const readingGroups = group ? [group] : groups;

  return (
    <div className="page-shell container cms-section content-page" id="letter-page-top" tabIndex={-1}>
      {isAdmin && section && <InlineSectionEditor locale={locale} section={section} />}
      <PageIntro
        title={viewTitle}
        eyebrow={isHe ? "המדריך המקצועי" : "الدليل المهني"}
        description={fullView && section ? local(section, "subtitle", locale) : undefined}
      />
      <nav className={styles.breadcrumb} aria-label={isHe ? "ניווט עמוד" : "تنقل الصفحة"}>
        <Link className="text-nav-action" href={`/${locale}`}>
          {isHe ? "דף הבית" : "الصفحة الرئيسية"}
        </Link>
        <span aria-hidden="true">‹</span>
        {group ? (
          <>
            <Link className="text-nav-action" href={viewRoot}>{viewTitle}</Link>
            <span aria-hidden="true">‹</span>
            <span aria-current="page">{group[locale]}</span>
          </>
        ) : <span aria-current="page">{viewTitle}</span>}
      </nav>
      {byLetter && <ArabicLetterSearch locale={locale} groups={groups} />}
      {fullView && <LetterGroupSearch locale={locale} groups={groups} />}
      {(fullView || byGroup || byStage) && (
        <nav className={styles.readerActions} aria-label={isHe ? "בחירת קבוצה" : "اختيار المجموعة"}>
          {fullView && group && <Link href={root}>{allLabel}</Link>}
          {groups.filter((item) => !byStage || item.id !== "overview").map((item) => (
            <Link key={item.id} href={`${viewRoot}${fullView ? "?" : "&"}group=${item.id}`}
              aria-current={group?.id === item.id ? "page" : undefined}>
              {item[locale]}
            </Link>
          ))}
        </nav>
      )}
      {byStage && group && group.id !== "overview" && (
        <nav className={styles.readerActions} aria-label={isHe ? "בחירת שלב" : "اختيار المرحلة"}>
          {rainStages.map((stage, index) => (
            <Link key={stage.he} href={`/${locale}/worksheets?letter-group=${group.id}&stage=${index + 1}`}>
              {isHe ? "שלב" : "المرحلة"} {index + 1}
            </Link>
          ))}
        </nav>
      )}
      {fullView && !group && <h2 className={styles.readerTitle}>{allLabel}</h2>}
      {(fullView || (group && !byStage)) && (
        <div className={styles.reader}>
          {readingGroups.map((item) => {
            const headingId = `group-${item.id}`;
            const main = <LetterReadingPage locale={locale} title={firstPage} id={`reading-${item.id}-main`}
              image={`${media}/${item.id}-main-preview.webp`} />;
            const story = <LetterReadingPage locale={locale} title={storyLabel} id={`reading-${item.id}-story`}
              image={`${media}/${item.id}-story-preview.webp`} />;
            return (
              <section key={item.id} className={styles.readerGroup} aria-labelledby={headingId}>
                <h2 className={styles.heading} id={headingId}>{item[locale]}</h2>
                {item.id === "overview" ? (
                  <LetterReadingPage locale={locale} title={item[locale]} id="reading-overview"
                    image={`${media}/overview-preview.webp`} />
                ) : (
                  <GroupReadingSequence group={item.id} locale={locale} main={main} story={story} />
                )}
              </section>
            );
          })}
        </div>
      )}
      <LetterBackToTop locale={locale} />
    </div>
  );
}
