import type { Locale } from "@/i18n/config";
import { getWorksheetLibrary } from "@/lib/worksheets";
import { WorksheetLibrary } from "@/components/worksheets/WorksheetLibrary";
import { Suspense } from "react";

export async function LocalizedWorksheetPage({ locale, isAdmin }: { locale: Locale; isAdmin: boolean }) {
  const data = await getWorksheetLibrary(isAdmin);
  return <Suspense fallback={null}><WorksheetLibrary locale={locale} data={data} isAdmin={isAdmin} /></Suspense>;
}
