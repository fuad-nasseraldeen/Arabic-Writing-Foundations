"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { isInternalHref, local, type SiteItem } from "@/lib/cms-shared";
import { CardContentRenderer } from "./CardContentRenderer";
import { CardFooter } from "./CardFooter";
import { normalizeSiteItemForRendering, resolveCardPrimaryAction } from "./card-content";
import { startNavigationProgress } from "@/components/navigation/NavigationProgress";

export function CmsCard({
  item,
  locale,
  childCount = 0,
  onOpenGroup,
  adminControls,
  className = "",
  preview = false,
}: {
  item: SiteItem;
  locale: Locale;
  childCount?: number;
  onOpenGroup?: () => void;
  adminControls?: ReactNode;
  className?: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const content = normalizeSiteItemForRendering(item);
  const action = resolveCardPrimaryAction(item, content.blocks, childCount > 0, locale);
  const actionable = !preview && action.type !== "none" && (action.type !== "group" || Boolean(onOpenGroup));
  const activate = () => {
    if (action.type === "group") onOpenGroup?.();
    else if (action.type === "document") window.open(action.url, "_blank", "noopener,noreferrer");
    else if (action.type === "link") {
      if (isInternalHref(action.href)) {
        startNavigationProgress();
        router.push(action.href);
      } else window.location.assign(action.href);
    }
  };
  const onClick = () => { if (actionable) activate(); };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!actionable || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    activate();
  };
  const cardClasses = [
    "cms-card", "cms-editable-card", actionable && "cms-card--actionable",
    `cms-card--background-${content.cardStyle.background}`,
    `cms-card--border-${content.cardStyle.border}`,
    `cms-card--density-${content.cardStyle.density}`,
    className,
  ].filter(Boolean).join(" ");
  return <article className={cardClasses}>
    {adminControls && <div className="cms-card__admin-controls" onClick={(event) => event.stopPropagation()}>{adminControls}</div>}
    <div className="cms-card__surface" role={actionable ? "button" : undefined} tabIndex={actionable ? 0 : undefined} aria-label={actionable ? local(item, "title", locale) : undefined} onClick={onClick} onKeyDown={onKeyDown}>
      <CardContentRenderer {...content} locale={locale} />
      <CardFooter blocks={content.blocks} locale={locale} childCount={childCount} showItemCount={content.cardStyle.showItemCount} />
    </div>
  </article>;
}
