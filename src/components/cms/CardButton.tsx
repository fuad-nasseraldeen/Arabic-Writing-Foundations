import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { SiteItem } from "@/lib/cms";
import { local } from "@/lib/cms";

export function CardButton({ item, locale }: { item: SiteItem; locale: Locale }) {
  const label = local(item, "cta_label", locale);
  const href = item.cta_href;
  // Existing cards created before show_button used their CTA fields directly.
  if (!(item.show_button || label) || !label || !href) return null;
  if (/^https?:\/\//i.test(href)) return <a className="card-link" href={href} target="_blank" rel="noopener noreferrer">{label}<ArrowLeft size={17} /></a>;
  const internalHref = href === "/"
    ? `/${locale}`
    : href.startsWith(`/${locale}/`) || href === `/${locale}`
      ? href
      : href.match(/^\/(he|ar)(\/|$)/)
        ? href.replace(/^\/(he|ar)/, `/${locale}`)
        : href.startsWith("/")
          ? `/${locale}${href}`
          : `/${locale}/${href}`;
  return <Link className="card-link" href={internalHref}><span>{label}</span><ArrowLeft size={17} /></Link>;
}
