import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { connection } from "next/server";
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}) { await connection(); const {locale}=await params; if(!isLocale(locale)) notFound(); await requireAdmin(locale); return <AdminShell locale={locale}>{children}</AdminShell>; }
