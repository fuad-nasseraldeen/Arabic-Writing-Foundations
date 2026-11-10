import { PageIntro } from "@/components/layout/PageIntro";
import type { Locale } from "@/i18n/config";
import { getPageCms, local } from "@/lib/cms";
import { InlineSectionEditor } from "@/components/cms/InlineSectionEditor";
import { ExpandableCardGrid } from "@/components/cms/ExpandableCardGrid";
import { GridSettings } from "@/components/cms/GridSettings";
import { PageHomeNavigation } from "@/components/navigation/PageHomeNavigation";
const columns = (settings: Record<string, unknown>) =>
  Math.min(4, Math.max(1, Number(settings.columns) || 3));
export async function LocalizedContentPage({
  locale,
  title,
  eyebrow,
  items: staticItems,
  pageKey,
  isAdmin = false,
}: {
  locale: Locale;
  title: string;
  eyebrow: string;
  items: string[];
  pageKey: string;
  isAdmin?: boolean;
}) {
  const { sections, items } = await getPageCms(pageKey, isAdmin);
  const section = sections[0],
    isHe = locale === "he",
    cmsItems = section
      ? items.filter((item) => item.section_id === section.id)
      : [];
  const addLabels: Record<string, string> = {
    letters: isHe ? "הוסף קבוצה" : "إضافة مجموعة",
    worksheets: isHe ? "הוסף דף עבודה" : "إضافة ورقة عمل",
    resources: isHe ? "הוסף חומר" : "إضافة مادة",
  };
  const sectionTitle = section ? local(section, "title", locale) : title;
  return (
    <div className={`page-shell container cms-section content-page content-page--${pageKey}`}>
      {section && (
        <>
          <InlineSectionEditor locale={locale} section={section} />
          <GridSettings locale={locale} section={section} />
        </>
      )}
      <PageIntro title={sectionTitle} eyebrow={eyebrow} description={section ? local(section, "subtitle", locale) : undefined} />
      {section ? (
        <ExpandableCardGrid
          locale={locale}
          items={cmsItems}
          columns={pageKey === "about" ? 1 : columns(section.settings || {})}
          sectionId={section.id}
          rootLabel={sectionTitle}
          addLabel={addLabels[pageKey] || (isHe ? "הוסף כרטיס" : "إضافة بطاقة")}
          emptyItemsAreGroups={pageKey === "letters"}
        />
      ) : (
        <>
          <PageHomeNavigation locale={locale} />
          <div className="content-list">
            {staticItems.map((item, i) => (
              <article key={item}>
                <span>0{i + 1}</span>
                <h2>{item}</h2>
                <p>
                  {isHe
                    ? "המידע המקצועי יתווסף ויעודכן על ידי צוות האתר."
                    : "ستتم إضافة المعلومات المهنية وتحديثها من قبل فريق الموقع."}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
