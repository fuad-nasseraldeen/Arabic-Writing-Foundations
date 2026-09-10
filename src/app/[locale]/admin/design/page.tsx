import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDesignSettings } from "@/lib/cms";
import { ThemeSelector } from "@/components/cms/ThemeSelector";
import { TypographySelector } from "@/components/cms/TypographySelector";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const settings = await getDesignSettings();
  return (
    <>
      <h1>{locale === "he" ? "עיצוב" : "التصميم"}</h1>
      <p className="muted-note">
        {locale === "he" ? "ערכת צבעים" : "مجموعة الألوان"}
      </p>
      <ThemeSelector locale={locale} activeTheme={settings.themeKey} />
      <section className="design-typography">
        <h2>{locale === "he" ? "גופן וגודל טקסט" : "الخط وحجم النص"}</h2>
        <p className="muted-note">
          {locale === "he"
            ? "הגדרות גלובליות לכל האתר. גופן וצפיפות הטקסט נשארים אחידים בכל כרטיס."
            : "إعدادات عامة للموقع كله. يبقى الخط وكثافة النص موحّدين في جميع البطاقات."}
        </p>
        <TypographySelector
          locale={locale}
          activePreset={settings.typographyPreset}
          activeScale={settings.textScale}
        />
      </section>
    </>
  );
}
