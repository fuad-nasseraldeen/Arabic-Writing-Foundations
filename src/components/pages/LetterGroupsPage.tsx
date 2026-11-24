import Image from "next/image";
import Link from "next/link";
import { InlineSectionEditor } from "@/components/cms/InlineSectionEditor";
import { PageIntro } from "@/components/layout/PageIntro";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
import { getPageCms, local } from "@/lib/cms";
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
  const storyLabel = isHe ? "סיפור" : "القصة";
  const overview = group?.id === "overview";

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
      {group ? (
        <section aria-labelledby="letter-group-title">
          <h2 className={styles.heading} id="letter-group-title">{group[locale]}</h2>
          {overview ? (
            <a href="/letter-groups/overview.pdf" className={styles.overview}>
              <Image
                src="/letter-groups/overview.webp"
                alt={group[locale]}
                width={923}
                height={1305}
                unoptimized
              />
              <span>{isHe ? "פתיחת הסיכום כ־PDF" : "فتح الملخص بصيغة PDF"}</span>
            </a>
          ) : (
            <>
              <h3 className={styles.storyTitle}>{storyLabel}</h3>
              <ul className={styles.storyGrid} lang="ar">
                {group.letters.map((letter, index) => (
                  <li key={letter}>
                    <Image
                      src={`/letter-groups/${group.id}-story-${index + 1}.webp`}
                      alt={`قصة حرف ${letter}`}
                      width={group.storySize[0]}
                      height={group.storySize[1]}
                      unoptimized
                    />
                  </li>
                ))}
              </ul>
              <a href={`/letter-groups/${group.id}-story.pdf`} className={styles.document}>
                {isHe ? "פתיחת הסיפור המלא כ־PDF" : "فتح القصة كاملة بصيغة PDF"}
              </a>
            </>
          )}
        </section>
      ) : (
        <section aria-label={title} className={styles.grid}>
          {groups.map((item) => (
            <Link key={item.id} href={`${root}?group=${item.id}`} className={styles.card}>
              <div className={styles.cover}>
                <Image
                  src={item.id === "overview"
                    ? "/letter-groups/overview.webp"
                    : `/letter-groups/${item.id}-main.webp`}
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
