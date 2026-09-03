import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
export function AdminShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const d = t(locale);
  const links = [
    ["", "dashboard"],
    ["pages", "pages"],
    ["tips", "tips"],
    ["content", "content"],
    ["categories", "categories"],
    ["media", "media"],
    ["design", "design"],
    ["users", "users"],
    ["admins", "admins"],
  ] as const;
  const labels: { [key: string]: string } = {
    dashboard: d.admin.dashboard,
    pages: locale === "he" ? "עמודים" : "الصفحات",
    tips: locale === "he" ? "טיפים" : "النصائح",
    content: d.admin.content,
    categories: d.admin.categories,
    media: d.admin.media,
    design: locale === "he" ? "עיצוב" : "التصميم",
    users: d.admin.users,
    admins: d.admin.admins,
  };
  return (
    <div className="admin-shell container">
      <aside className="admin-sidebar">
        <b>{d.admin.welcome}</b>
        {links.map(([href, key]) => (
          <Link href={`/${locale}/admin/${href}`} key={key}>
            {labels[key]}
          </Link>
        ))}
      </aside>
      <section className="admin-main">{children}</section>
    </div>
  );
}
