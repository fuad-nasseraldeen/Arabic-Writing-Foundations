import Link from "next/link";
import type { Locale } from "@/i18n/config";

export function PageHomeNavigation({ locale }: { locale: Locale }) {
  return (
    <nav
      className="page-home-navigation"
      aria-label={locale === "he" ? "ניווט עמוד" : "تنقل الصفحة"}
    >
      <Link className="text-nav-action" href={`/${locale}`}>
        {locale === "he" ? "דף הבית" : "الصفحة الرئيسية"}
      </Link>
    </nav>
  );
}
