"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Layers, ListOrdered, Search } from "lucide-react";
import { t } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export function GuideShortcuts({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const view = useSearchParams().get("view");
  const home = `/${locale}`;
  const letters = `${home}/letters`;
  if (pathname !== home && pathname !== letters && pathname !== `${letters}/`) return null;

  const labels = t(locale).home;
  const shortcuts = [
    { view: "letter", label: labels.byLetter, Icon: Search },
    { view: "group", label: labels.byGroup, Icon: Layers },
    { view: "stage", label: labels.byStage, Icon: ListOrdered },
  ];

  return (
    <nav className="guide-shortcuts" aria-label={labels.guide}>
      {shortcuts.map(({ view: target, label, Icon }) => (
        <Link key={target} href={`${letters}?view=${target}`}
          aria-current={view === target && pathname !== home ? "page" : undefined}>
          <Icon size={18} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
