import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getActiveTheme } from "@/lib/cms";
import { ThemeSelector } from "@/components/cms/ThemeSelector";
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();const active=await getActiveTheme();return <><h1>{locale==="he"?"ערכות צבעים":"أنماط الألوان"}</h1><p className="muted-note">{locale==="he"?"ערכות מלאות וקבועות מראש בלבד. אין בחירת צבעים פרטנית.":"أنماط كاملة ومحددة مسبقاً فقط، من دون اختيار ألوان فردية."}</p><ThemeSelector locale={locale} activeTheme={active}/></>}
