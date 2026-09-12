"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { local, type SiteItem } from "@/lib/cms-shared";
import { AddItemCard, InlineItemEditor } from "./InlineItemEditor";
import { CardMedia } from "./CardMedia";
import { useCmsEditMode } from "./CmsAdminProvider";
import { CardContentRenderer } from "./CardContentRenderer";
import {
  hasStoredContentBlocks,
  normalizeSiteItemForRendering,
} from "./card-content";

const copy = {
  he: {
    back: "חזרה",
    items: "פריטים",
    empty: "אין עדיין פריטים ברמה זו",
    addChild: "הוסף תוכן ל־",
  },
  ar: {
    back: "رجوع",
    items: "عناصر",
    empty: "لا توجد عناصر في هذا المستوى بعد",
    addChild: "إضافة محتوى إلى ",
  },
};
const itemColumns = (item: SiteItem | undefined, fallback: number) =>
  Math.min(4, Math.max(1, Number(item?.settings?.childColumns) || fallback));

function CmsCard({
  item,
  locale,
  childItems,
  onOpen,
}: {
  item: SiteItem;
  locale: Locale;
  childItems: SiteItem[];
  onOpen: (item: SiteItem) => void;
}) {
  const isGroup = childItems.length > 0 || item.click_behavior === "children";
  const title = local(item, "title", locale);
  const content = normalizeSiteItemForRendering(item);
  const usesOrderedContent = hasStoredContentBlocks(item);
  const childCount = content.cardStyle.childCount;
  const groupAction = childCount.visible ? (
    <button
      type="button"
      className={`drilldown-group-content-trigger interactive-button child-count-position-${childCount.position} child-count-${childCount.border ? "bordered" : "clean"} child-count-${childCount.variant}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(item);
      }}
      aria-label={`${title}, ${childItems.length} ${copy[locale].items}`}
    >
      <FolderOpen size={18} />
      <span>{childItems.length} {copy[locale].items}</span>
      {locale === "he" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  ) : null;
  return (
    <article
      className={`cms-editable-card drilldown-card interactive-card ${item.variant || "default"} ${isGroup ? "drilldown-group" : ""}`}
    >
      <InlineItemEditor locale={locale} item={item} childItems={childItems} />
      {isGroup && !usesOrderedContent && (
        <CardMedia item={item} locale={locale} position="top" />
      )}
      {isGroup ? (
        usesOrderedContent ? (
          <>
            <CardContentRenderer {...content} locale={locale} />
            {groupAction}
          </>
        ) : (
          <>
            <button
              type="button"
              className="drilldown-group-trigger interactive-button"
              onClick={(event) => { event.stopPropagation(); onOpen(item); }}
              aria-label={`${title}, ${childItems.length} ${copy[locale].items}`}
            >
              <span>
                <h2>{title}</h2>
                {local(item, "description", locale) && <p>{local(item, "description", locale)}</p>}
              </span>
            </button>
            {groupAction}
          </>
        )
      ) : (
        <>
          <CardContentRenderer {...content} locale={locale} />
        </>
      )}
      {isGroup && !usesOrderedContent && (
        <CardMedia item={item} locale={locale} position="bottom" />
      )}
    </article>
  );
}

export function ExpandableCardGrid({
  locale,
  items,
  columns,
  addLabel,
  sectionId,
  rootLabel,
}: {
  locale: Locale;
  items: SiteItem[];
  columns: number;
  addLabel: string;
  sectionId: string;
  rootLabel: string;
}) {
  const editing = useCmsEditMode(),
    l = copy[locale];
  const byId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const valid = (id: string | null) => (id && byId.has(id) ? id : null);
  const [currentId, setCurrentId] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : valid(new URLSearchParams(window.location.search).get("group")),
  );
  const [leaving, setLeaving] = useState(false),
    [direction, setDirection] = useState<"forward" | "back">("forward");
  useEffect(() => {
    const onPopState = () =>
      setCurrentId(
        valid(new URLSearchParams(window.location.search).get("group")),
      );
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [byId]);
  const trail = useMemo(() => {
    const result: SiteItem[] = [];
    let node = currentId ? byId.get(currentId) : undefined;
    const seen = new Set<string>();
    while (node && !seen.has(node.id)) {
      result.unshift(node);
      seen.add(node.id);
      node = node.parent_id ? byId.get(node.parent_id) : undefined;
    }
    return result;
  }, [currentId, byId]);
  const current = currentId ? byId.get(currentId) : undefined;
  const visible = items.filter((item) =>
    currentId ? item.parent_id === currentId : !item.parent_id,
  );
  const navigate = (next: string | null, nextDirection: "forward" | "back") => {
    if (next === currentId) return;
    setDirection(nextDirection);
    setLeaving(true);
    window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (next) params.set("group", next);
      else params.delete("group");
      const url = `${window.location.pathname}${params.size ? `?${params}` : ""}`;
      window.history.pushState({}, "", url);
      setCurrentId(valid(next));
      setLeaving(false);
    }, 220);
  };
  const contextualAdd = currentId
    ? `${l.addChild}${local(current!, "title", locale)}`
    : addLabel;
  return (
    <section
      className={`drilldown-collection motion-${direction}`}
      aria-live="polite"
    >
      <nav
        className="hierarchy-nav"
        aria-label={locale === "he" ? "מיקום בהיררכיה" : "الموقع في التسلسل"}
      >
        {currentId && (
          <button
            className="hierarchy-back"
            type="button"
            onClick={() => navigate(current?.parent_id || null, "back")}
          >
            {locale === "he" ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
            <span>{l.back}</span>
          </button>
        )}
        <ol className="hierarchy-breadcrumb">
          <li>
            <button type="button" onClick={() => navigate(null, "back")}>
              {rootLabel}
            </button>
          </li>
          {trail.map((node, index) => (
            <li key={node.id}>
              {index === trail.length - 1 ? (
                <span aria-current="page">{local(node, "title", locale)}</span>
              ) : (
                <button type="button" onClick={() => navigate(node.id, "back")}>
                  {local(node, "title", locale)}
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {current && (
        <h2 className="drilldown-title">{local(current, "title", locale)}</h2>
      )}
      <div
        className={`drilldown-grid ${leaving ? "is-leaving" : ""}`}
        style={
          {
            "--drilldown-columns": itemColumns(current, columns),
          } as React.CSSProperties
        }
      >
        {visible.map((item) => (
          <CmsCard
            key={item.id}
            item={item}
            locale={locale}
            childItems={items.filter(
              (candidate) => candidate.parent_id === item.id,
            )}
            onOpen={(node) => navigate(node.id, "forward")}
          />
        ))}
        {editing && (
          <AddItemCard
            locale={locale}
            sectionId={sectionId}
            parentId={currentId || undefined}
            label={contextualAdd}
          />
        )}
      </div>
      {!visible.length && !editing && (
        <p className="drilldown-empty">{l.empty}</p>
      )}
    </section>
  );
}
