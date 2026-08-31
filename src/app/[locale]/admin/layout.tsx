import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}) { const {locale}=await params; if(!isLocale(locale)) notFound(); await requireAdmin(locale); return <AdminShell locale={locale}>{children}</AdminShell>; }
