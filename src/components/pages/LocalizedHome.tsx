import Link from "next/link";
import { ArrowLeft, Layers, ListOrdered, NotebookPen, Search } from "lucide-react";
import { Fragment } from "react";
import type { CSSProperties } from "react";
import { t } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { dailyWritingTitle } from "@/data/daily-writing";
import { getPageCms, local, type Section } from "@/lib/cms";
import { resolveInternalHref } from "@/lib/cms-shared";
import { InlineSectionEditor } from "@/components/cms/InlineSectionEditor";
import {
  AddItemCard,
  InlineItemEditor,
} from "@/components/cms/InlineItemEditor";
import { CmsCard } from "@/components/cms/CmsCard";
import { GridSettings } from "@/components/cms/GridSettings";
import { ScrollEntrance } from "@/components/navigation/ScrollEntrance";

function gridStyle(section: Section): CSSProperties {
  const columns = Math.min(
    4,
    Math.max(1, Number(section.settings.columns) || 3),
  );
  return {
    "--desktop-columns": columns,
    "--tablet-columns": Math.min(columns, 2),
  } as CSSProperties;
}

export async function LocalizedHome({
  locale,
  isAdmin = false,
}: {
  locale: Locale;
  isAdmin?: boolean;
}) {
  const dictionary = t(locale);
  const { home } = dictionary;
  const modes = [
    { view: "letter", title: home.byLetter, description: home.letterDescription, Icon: Search },
    { view: "group", title: home.byGroup, description: home.groupDescription, Icon: Layers },
    { view: "stage", title: home.byStage, description: home.stageDescription, Icon: ListOrdered },
  ];
  const { sections, items } = await getPageCms("home", isAdmin);
  const byKey = (key: string) =>
    sections.find((section) => section.key === key);
  const hero = byKey("home.hero");
  const features = byKey("home.features");
  const explore = byKey("home.explore");
  const project = byKey("home.project");
  const author = byKey("home.author");
  const itemsFor = (section?: Section) =>
    section ? items.filter((item) => item.section_id === section.id) : [];
  const featureItems = itemsFor(features);
  const lettersCardIndex = featureItems.findIndex(
    (item) => resolveInternalHref(item.cta_href || "", locale).split(/[?#]/, 1)[0] === `/${locale}/letters`,
  );
  const dailyWritingCard = (
    <article className="cms-card cms-card--interactive home-daily-writing">
      <Link className="cms-card__surface" href={`/${locale}/daily-writing`}>
        <span className="home-daily-writing__icon"><NotebookPen size={25} aria-hidden="true" /></span>
        <h3 className="card-content__title">{dailyWritingTitle[locale]}</h3>
        <p>{locale === "he" ? "מתרגלים כתיבה עם תפריט, רשימת קניות ועוד פעילויות מהיום־יום." : "نتدرّب على الكتابة من خلال قائمة طعام وقائمة مشتريات وأنشطة يومية أخرى."}</p>
        <div className="cms-card__footer"><ArrowLeft size={20} aria-hidden="true" /></div>
      </Link>
    </article>
  );
  const heroTitle = hero ? local(hero, "title", locale) : dictionary.home.title;
  const heroSubtitle = hero
    ? local(hero, "subtitle", locale)
    : dictionary.home.description;

  return (
    <>
      <ScrollEntrance />
      <section className="hero cms-section">
        {hero && <InlineSectionEditor locale={locale} section={hero} />}
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{dictionary.home.eyebrow}</span>
            <h1>{heroTitle}</h1>
            <p>{heroSubtitle}</p>
            <Link
              className="button"
              href={resolveInternalHref(String(hero?.settings.cta_href || "#guide"), locale)}
            >
              {String(
                hero?.settings[`cta_label_${locale}`] || dictionary.home.start,
              )}
              <ArrowLeft size={18} />
            </Link>
          </div>
          <div className="hero-art" aria-hidden="true">
            <i className="branch a">❧</i>
            <i className="branch b">❧</i>
            <div className="paper paper-one">
              <svg className="hero-letter" viewBox="0 0 160 180"><text x="80" y="105" textAnchor="middle">ب</text></svg>
            </div>
            <div className="paper paper-two">
              <svg className="hero-letter" viewBox="0 0 160 180"><text x="80" y="105" textAnchor="middle">غ</text></svg>
            </div>
            <div className="paper paper-three">
              <svg className="hero-letter" viewBox="0 0 160 180"><text x="80" y="105" textAnchor="middle">ج</text></svg>
            </div>
            <div className="pencil" />
          </div>
        </div>
      </section>

      {features && (
        <section id="guide" className="feature-section container cms-section" data-scroll-enter>
          <InlineSectionEditor locale={locale} section={features} />
          <GridSettings locale={locale} section={features} />
          <div
            className="feature-grid cms-card-grid"
            style={gridStyle(features)}
          >
            {featureItems.map((item, index) => {
              return (
                <Fragment key={item.id}>
                  <CmsCard
                    item={item}
                    locale={locale}
                    adminControls={<InlineItemEditor locale={locale} item={item} />}
                  />
                  {index === Math.max(lettersCardIndex, 0) && dailyWritingCard}
                </Fragment>
              );
            })}
            {!featureItems.length && dailyWritingCard}
            <AddItemCard
              locale={locale}
              sectionId={features.id}
              label={locale === "he" ? "הוסף כרטיס" : "إضافة بطاقة"}
            />
          </div>
        </section>
      )}

      {(!explore || explore.is_visible || isAdmin) && (
        <section className="explore container cms-section" data-scroll-enter>
          {explore && <GridSettings locale={locale} section={explore} />}
          <div className="section-intro">
            <span className="eyebrow">{dictionary.home.guide}</span>
            <h2>{home.threeWays}</h2>
          </div>
          <div
            className="explore-grid home-explore-grid cms-card-grid"
            style={explore ? gridStyle(explore) : undefined}
          >
            {modes.map(({ view, title, description, Icon }) => (
              <article key={view} className={`cms-card cms-card--interactive home-explore-card home-explore-card--${view}`}>
                <Link className="cms-card__surface" href={`/${locale}/letters?view=${view}`}>
                  <div className="cms-card__main">
                    <span className="home-explore-card__icon"><Icon size={24} aria-hidden="true" /></span>
                    <h3 className="card-content__title">{title}</h3>
                    <p>{description}</p>
                  </div>
                  <div className="cms-card__footer">
                    <ArrowLeft size={20} aria-hidden="true" />
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {(project || author) && (
        <section className="project-preview container" data-scroll-enter>
          <div className="project-preview__content">
          {author &&
            itemsFor(author).map((item) => {
              return <CmsCard key={item.id} item={item} locale={locale} adminControls={<InlineItemEditor locale={locale} item={item} portraitOnly />} />
            })}
          {author && (
            <AddItemCard
              locale={locale}
              sectionId={author.id}
              label={locale === "he" ? "הוסף פריט אודותיי" : "إضافة عنصر عني"}
            />
          )}
          {project &&
            itemsFor(project).map((item) => {
              return <CmsCard key={item.id} item={item} locale={locale} adminControls={<InlineItemEditor locale={locale} item={item} />} />
            })}
          {project && (
            <AddItemCard
              locale={locale}
              sectionId={project.id}
              label={
                locale === "he" ? "הוסף פריט לפרויקט" : "إضافة عنصر للمشروع"
              }
            />
          )}
          </div>
        </section>
      )}
    </>
  );
}
