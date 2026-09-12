import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CSSProperties } from "react";
import { t } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getPageCms, local, type Section } from "@/lib/cms";
import { InlineSectionEditor } from "@/components/cms/InlineSectionEditor";
import {
  AddItemCard,
  InlineItemEditor,
} from "@/components/cms/InlineItemEditor";
import { CmsCard } from "@/components/cms/CmsCard";
import { GridSettings } from "@/components/cms/GridSettings";

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
  const heroTitle = hero ? local(hero, "title", locale) : dictionary.home.title;
  const heroSubtitle = hero
    ? local(hero, "subtitle", locale)
    : dictionary.home.description;

  return (
    <>
      <section className="hero cms-section">
        {hero && <InlineSectionEditor locale={locale} section={hero} />}
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{dictionary.home.eyebrow}</span>
            <h1>{heroTitle}</h1>
            <p>{heroSubtitle}</p>
            <Link
              className="button"
              href={String(hero?.settings.cta_href || "#guide")}
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
              <span className="arabic">ب</span>
            </div>
            <div className="paper paper-two">
              <span className="arabic">ع</span>
            </div>
            <div className="paper paper-three">
              <span className="arabic">ح</span>
            </div>
            <div className="pencil" />
          </div>
        </div>
      </section>

      {features && (
        <section id="guide" className="feature-section container cms-section">
          <InlineSectionEditor locale={locale} section={features} />
          <GridSettings locale={locale} section={features} />
          <div
            className="feature-grid cms-card-grid"
            style={gridStyle(features)}
          >
            {itemsFor(features).map((item) => {
              return (
                <CmsCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  adminControls={<InlineItemEditor locale={locale} item={item} />}
                />
              );
            })}
            <AddItemCard
              locale={locale}
              sectionId={features.id}
              label={locale === "he" ? "הוסף כרטיס" : "إضافة بطاقة"}
            />
          </div>
        </section>
      )}

      {explore && (
        <section className="explore container cms-section">
          <InlineSectionEditor locale={locale} section={explore} />
          <GridSettings locale={locale} section={explore} />
          <div className="section-intro">
            <span className="eyebrow">{dictionary.home.guide}</span>
            <h2>{local(explore, "title", locale)}</h2>
            <p>{local(explore, "subtitle", locale)}</p>
          </div>
          <div
            className="explore-grid home-explore-grid cms-card-grid"
            style={gridStyle(explore)}
          >
            {itemsFor(explore).map((item) => {
              return (
                <CmsCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  adminControls={<InlineItemEditor locale={locale} item={item} />}
                />
              );
            })}
            <AddItemCard
              locale={locale}
              sectionId={explore.id}
              label={locale === "he" ? "הוסף דרך" : "إضافة مسار"}
            />
          </div>
        </section>
      )}

      {(project || author) && (
        <section className="project-preview container">
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
        </section>
      )}
    </>
  );
}
