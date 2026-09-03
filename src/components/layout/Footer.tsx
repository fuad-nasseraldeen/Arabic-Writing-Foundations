import Link from "next/link";
import { Brand } from "./Header";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";

const primaryLinks = ["home", "letters", "worksheets", "resources"] as const;
const secondaryLinks = ["weeklyTip", "project", "about"] as const;
const hrefs = {
  home: "",
  letters: "letters",
  worksheets: "worksheets",
  resources: "resources",
  weeklyTip: "weekly-tip",
  project: "project",
  about: "about",
} as const;

export function Footer({ locale }: { locale: Locale }) {
  const d = t(locale);
  const labels =
    locale === "he"
      ? { navigation: "ניווט", information: "מידע" }
      : { navigation: "التنقل", information: "معلومات" };

  const renderLinks = (links: readonly (keyof typeof hrefs)[]) =>
    links.map((key) => (
      <Link key={key} href={`/${locale}/${hrefs[key]}`}>
        {d.nav[key]}
      </Link>
    ));

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <section className="footer-brand" aria-label={d.brand}>
          <Brand locale={locale} />
          <p>{d.footer}</p>
        </section>
        <nav className="footer-nav" aria-label={labels.navigation}>
          <h2>{labels.navigation}</h2>
          {renderLinks(primaryLinks)}
        </nav>
        <nav className="footer-nav" aria-label={labels.information}>
          <h2>{labels.information}</h2>
          {renderLinks(secondaryLinks)}
        </nav>
        <div className="footer-bottom">
          <small>© {new Date().getFullYear()}</small>
        </div>
      </div>
    </footer>
  );
}
