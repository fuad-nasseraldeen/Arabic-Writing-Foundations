import Image from "next/image";
import Link from "next/link";
import { InlineSectionEditor } from "@/components/cms/InlineSectionEditor";
import { PageIntro } from "@/components/layout/PageIntro";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
import { getPageCms, local } from "@/lib/cms";
import { RainMaterials } from "./RainMaterials";
import { DocumentPreviewButton } from "@/components/worksheets/DocumentPreview";
import styles from "./LetterGroupsPage.module.css";

const groups = [
  { id: "wheel", he: "גלגל", ar: "عجلة", storySize: [1003, 260], letters: ["ميم", "واو", "هاء", "فاء", "قاف"] },
  { id: "soup", he: "מרקיה", ar: "صحن الشوربة", storySize: [1007, 424], letters: ["نون", "سين", "شين"] },
  { id: "slide", he: "מגלשה", ar: "زحليقة", storySize: [1007, 319], letters: ["راء", "زاي", "دال", "ذال"] },
  { id: "butterfly", he: "פרפר", ar: "فراشة", storySize: [1003, 219], letters: ["جيم", "حاء", "خاء", "عين", "غين", "ياء"] },
  { id: "rain", he: "גשם", ar: "مطر", storySize: [1003, 219], letters: ["ألف", "باء", "تاء", "ثاء", "كاف", "لام"] },
  { id: "egg", he: "ביצה", ar: "بيضة", storySize: [1007, 319], letters: ["صاد", "ضاد", "طاء", "ظاء"] },
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
  const storyLabel = isHe ? "סיפור" : "القصة";
  const overview = group?.id === "overview";
  const groupTitle = group?.id === "rain"
    ? (isHe ? "קבוצת הגשם" : "مجموعة المطر")
    : group?.[locale];
  const story = group && group.id !== "overview" && (
    <>
      <h3 className={styles.storyTitle}>{storyLabel}</h3>
      <ul className={styles.storyGrid}>
        {group.letters.map((letter, index) => (
          <li key={letter}>
            <Image
              src={`${media}/${group.id}-story-${index + 1}.webp`}
              alt={isHe ? `סיפור ${index + 1} בקבוצת ${group.he}` : `قصة حرف ${letter}`}
              width={group.storySize[0]}
              height={group.storySize[1]}
              unoptimized
            />
          </li>
        ))}
      </ul>
      <DocumentPreviewButton locale={locale} title={storyLabel} url={`${media}/${group.id}-story.pdf`} className={styles.document}>
        {isHe ? "פתיחת הסיפור המלא כ־PDF" : "فتح القصة كاملة بصيغة PDF"}
      </DocumentPreviewButton>
    </>
  );

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
            <span aria-current="page">{groupTitle}</span>
          </>
        ) : <span aria-current="page">{title}</span>}
      </nav>
      {group ? (
        <section aria-labelledby="letter-group-title">
          <h2 className={styles.heading} id="letter-group-title">{groupTitle}</h2>
          {overview ? (
            <DocumentPreviewButton locale={locale} title={group[locale]} url={`${media}/overview.pdf`} className={styles.overview}>
              <Image
                src={`${media}/overview.webp`}
                alt={group[locale]}
                width={923}
                height={1305}
                unoptimized
              />
              <span>{isHe ? "פתיחת הסיכום כ־PDF" : "فتح الملخص بصيغة PDF"}</span>
            </DocumentPreviewButton>
          ) : group.id === "rain" ? <RainMaterials locale={locale} story={story} /> : story}
        </section>
      ) : (
        <section aria-label={title} className={styles.grid}>
          {groups.map((item) => (
            <Link key={item.id} href={`${root}?group=${item.id}`} className={styles.card}>
              <div className={styles.cover}>
                <Image
                  src={`${media}/${item.id === "overview" ? "overview" : `${item.id}-main`}.webp`}
                  alt=""
                  width={923}
                  height={1305}
                  unoptimized
                />
              </div>
              <h2>{item[locale]}</h2>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
