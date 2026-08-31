import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { LocalizedHome } from "@/components/pages/LocalizedHome";
export default async function Page({params}:{params:Promise<{locale:string}>}) { const {locale}=await params; if(!isLocale(locale)) notFound(); return <LocalizedHome locale={locale}/>; }
