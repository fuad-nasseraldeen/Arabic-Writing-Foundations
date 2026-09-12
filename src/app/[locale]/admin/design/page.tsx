import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDesignSettings } from "@/lib/cms";
import { ThemeSelector } from "@/components/cms/ThemeSelector";
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
    </>
  );
}
