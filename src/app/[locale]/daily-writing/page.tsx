import { notFound } from "next/navigation";
import { DailyWritingPage } from "@/components/pages/DailyWritingPage";
import { dailyWritingTitle } from "@/data/daily-writing";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dailyWritingTitle[locale] } : {};
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <DailyWritingPage locale={locale} />;
}
