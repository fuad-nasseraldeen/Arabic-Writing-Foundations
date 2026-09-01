import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getActiveTheme } from "@/lib/cms";
import { themeNames } from "@/components/cms/ThemeTokens";
import { saveTheme } from "../actions";
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();const active=await getActiveTheme();return <><h1>{locale==="he"?"ערכות צבעים":"أنماط الألوان"}</h1><p className="muted-note">{locale==="he"?"ערכות מלאות וקבועות מראש בלבד. אין בחירת צבעים פרטנית.":"أنماط كاملة ومحددة مسبقاً فقط، من دون اختيار ألوان فردية."}</p><form action={saveTheme.bind(null,locale)} className="theme-presets">{Object.entries(themeNames).map(([key,name])=><label className={`theme-preview ${active===key?"selected":""}`} key={key}><input type="radio" name="theme_key" value={key} defaultChecked={active===key}/><span className={`preview-swatch ${key}`}/><b>{name}</b><small>{active===key?(locale==="he"?"פעיל":"نشط"):(locale==="he"?"תצוגה מקדימה":"معاينة")}</small></label>)}<button className="button">{locale==="he"?"החל ערכת צבעים":"تطبيق النمط"}</button></form></>}
