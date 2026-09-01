import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getPageCms } from "@/lib/cms";
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();const {sections}=await getPageCms("home",true);return <><h1>{locale==="he"?"עמודים ואזורים":"الصفحات والأقسام"}</h1><div className="admin-table">{sections.map(s=><article key={s.id}><div><b>{s.key}</b><small>{locale==="he"?s.title_he:s.title_ar||s.title_he}</small></div><Link className="outline-button" href={`/${locale}`}>{locale==="he"?"עריכה באתר":"تحرير في الموقع"}</Link></article>)}</div></>}
