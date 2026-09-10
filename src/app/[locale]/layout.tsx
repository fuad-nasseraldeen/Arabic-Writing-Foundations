import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { isLocale, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
import "./admin/admin.css";
import "@/components/cms/cms.css";
import "@/components/cms/fullscreen-editor.css";
import { ThemeTokens } from "@/components/cms/ThemeTokens";
import { getDesignSettings } from "@/lib/cms";
import { CmsAdminProvider } from "@/components/cms/CmsAdminProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import "@/components/navigation/navigation.css";
export function generateStaticParams() {
  return [{ locale: "he" }, { locale: "ar" }];
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = t(locale);
  return {
    title: d.brand,
    description:
      locale === "he"
        ? "מדריך מקצועי לקדם־כתיבה וכתיבת אותיות בערבית."
        : "دليل مهني للكتابة التمهيدية وكتابة الحروف العربية.",
    alternates: { languages: { he: "/he", ar: "/ar" } },
  };
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const design = await getDesignSettings();
  return (
    <AuthProvider>
    <CmsAdminProvider locale={locale}>
      <div
        lang={locale}
        dir="rtl"
        className={locale === "ar" ? "locale-ar" : "locale-he"}
      >
        <ThemeTokens settings={design} />
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Header locale={locale as Locale} />
        <main>{children}</main>
        <Footer locale={locale as Locale} />
      </div>
    </CmsAdminProvider>
    </AuthProvider>
  );
}
