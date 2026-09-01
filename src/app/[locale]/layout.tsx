import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { isLocale, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
import "./admin/admin.css";
import "@/components/cms/cms.css";
import "@/components/cms/fullscreen-editor.css";
import { ThemeTokens } from "@/components/cms/ThemeTokens";
import { getAuthContext } from "@/lib/auth";
import { CmsAdminProvider } from "@/components/cms/CmsAdminProvider";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import "@/components/navigation/navigation.css";
export function generateStaticParams(){ return [{locale:"he"},{locale:"ar"}]; }
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{ const {locale}=await params; if(!isLocale(locale)) return {}; const d=t(locale); return { title: d.brand, description: locale==="he"?"מדריך מקצועי לקדם־כתיבה וכתיבת אותיות בערבית.":"دليل مهني للكتابة التمهيدية وكتابة الحروف العربية.", alternates:{languages:{he:"/he",ar:"/ar"}} }; }
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}) { const {locale}=await params; if(!isLocale(locale)) notFound(); const auth=await getAuthContext(); const user=auth.user?{email:auth.user.email,full_name:auth.user.user_metadata.full_name||auth.user.user_metadata.name,avatar_url:auth.user.user_metadata.avatar_url||auth.user.user_metadata.picture}:null; return <CmsAdminProvider isAdmin={auth.isAdmin} locale={locale}><div lang={locale} dir="rtl" className={locale==="ar"?"locale-ar":"locale-he"}><ThemeTokens/><NavigationProgress/><Header locale={locale as Locale} user={user} isAdmin={auth.isAdmin}/><main>{children}</main><Footer locale={locale as Locale}/></div></CmsAdminProvider>; }
