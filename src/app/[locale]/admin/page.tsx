import { createClient } from "@/lib/supabase/server";
import { t } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
export default async function Page({params}:{params:Promise<{locale:string}>}) { const {locale}=await params; if(!isLocale(locale)) notFound(); const supabase=await createClient(); const [categories,content,media]=await Promise.all([supabase.from("categories").select("id",{count:"exact",head:true}),supabase.from("content_items").select("id",{count:"exact",head:true}),supabase.from("media").select("id",{count:"exact",head:true})]); const d=t(locale); return <><span className="eyebrow">{d.admin.welcome}</span><h1>{d.admin.dashboard}</h1><div className="admin-stats"><article><b>{categories.count||0}</b><span>{d.admin.categories}</span></article><article><b>{content.count||0}</b><span>{d.admin.content}</span></article><article><b>{media.count||0}</b><span>{d.admin.media}</span></article></div></>; }
