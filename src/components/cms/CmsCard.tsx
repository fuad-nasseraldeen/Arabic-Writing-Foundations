"use client";

import type { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
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
  forceGroup = false,
}: {
  item: SiteItem;
  locale: Locale;
  childCount?: number;
  onOpenGroup?: () => void;
  adminControls?: ReactNode;
  className?: string;
  preview?: boolean;
  /** Collection-level structure can make an empty item an enterable group. */
  forceGroup?: boolean;
}) {
  const content = normalizeSiteItemForRendering(item);
  const action = resolveCardPrimaryAction(item, content.blocks, childCount > 0, locale, forceGroup);
  // The resolver is the single action authority. A group needs its supplied
  // opener to be actionable; editor previews intentionally stay passive.
  const interactive = !preview && action.type !== "none" && (action.type !== "group" || Boolean(onOpenGroup));
  const activateGroup = () => {
    if (action.type === "group") onOpenGroup?.();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive || action.type !== "group" || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    activateGroup();
  };
  const cardClasses = [
    "cms-card", "cms-editable-card", interactive ? "cms-card--interactive" : "cms-card--passive",
    `cms-card--background-${content.cardStyle.background}`,
    `cms-card--border-${content.cardStyle.border}`,
    `cms-card--density-${content.cardStyle.density}`,
    className,
  ].filter(Boolean).join(" ");
  const cardContent = <>
    <div className="cms-card__main">
      <CardContentRenderer {...content} locale={locale} />
    </div>
    <CardFooter blocks={content.blocks} locale={locale} childCount={childCount} showItemCount={content.cardStyle.showItemCount} />
  </>;

  const surface = !interactive ? (
    <div className="cms-card__surface">{cardContent}</div>
  ) : action.type === "group" ? (
    <div className="cms-card__surface" role="button" tabIndex={0} aria-label={local(item, "title", locale)} onClick={activateGroup} onKeyDown={onKeyDown}>
      {cardContent}
    </div>
  ) : action.type === "document" ? (
    <a className="cms-card__surface" href={action.url} target="_blank" rel="noreferrer" aria-label={local(item, "title", locale)}>
      {cardContent}
    </a>
  ) : isInternalHref(action.href) ? (
    <Link className="cms-card__surface" href={action.href} aria-label={local(item, "title", locale)} onNavigate={startNavigationProgress}>
      {cardContent}
    </Link>
  ) : (
    <a className="cms-card__surface" href={action.href} aria-label={local(item, "title", locale)}>{cardContent}</a>
  );

  return <article className={cardClasses}>
    {adminControls && <div className="cms-card__admin-controls" onClick={(event) => event.stopPropagation()}>{adminControls}</div>}
    {surface}
  </article>;
}
