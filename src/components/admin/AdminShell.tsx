import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
export function AdminShell({locale,children}:{locale:Locale;children:React.ReactNode}) { const d=t(locale); const links=[['','dashboard'],['content','content'],['categories','categories'],['media','media'],['users','users'],['admins','admins']] as const; return <div className="admin-shell container"><aside className="admin-sidebar"><b>{d.admin.welcome}</b>{links.map(([href,key])=><Link href={`/${locale}/admin/${href}`} key={key}>{d.admin[key]}</Link>)}</aside><section className="admin-main">{children}</section></div>; }
