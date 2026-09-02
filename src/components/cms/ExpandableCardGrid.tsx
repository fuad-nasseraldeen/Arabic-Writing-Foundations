"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { local, type SiteItem } from "@/lib/cms-shared";
import { AddItemCard, InlineItemEditor } from "./InlineItemEditor";
import { CardButton } from "./CardButton";
import { CardMedia } from "./CardMedia";
import { useCmsEditMode } from "./CmsAdminProvider";

function useColumns(desktop: number) {
  const [columns, setColumns] = useState(desktop);
  useEffect(() => {
    const update = () =>
      setColumns(
        window.innerWidth <= 680
          ? 1
          : window.innerWidth <= 900
            ? Math.min(2, desktop)
            : desktop,
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [desktop]);
  return columns;
}

function CmsCard({
  item,
  locale,
  childItems,
  expanded,
  onToggle,
  depth,
}: {
  item: SiteItem;
  locale: Locale;
  childItems: SiteItem[];
  expanded: boolean;
  onToggle: () => void;
  depth: number;
}) {
  const isGroup = item.click_behavior === "children" && depth < 2;
  const regionId = `child-groups-${item.id}`;
  return (
    <article
      className={`cms-editable-card nested-card ${expanded ? "nested-card-active" : ""}`}
    >
      <InlineItemEditor locale={locale} item={item} childItems={childItems} />
      <CardMedia item={item} locale={locale} position="top" />
      {isGroup ? (
        <button
          type="button"
          className="cms-group-trigger"
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={onToggle}
        >
          <span>
            <h2>{local(item, "title", locale)}</h2>
            <p>{local(item, "description", locale)}</p>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={expanded ? "nested-chevron-open" : ""}
            size={21}
          />
        </button>
      ) : (
        <>
          <h2>{local(item, "title", locale)}</h2>
          <p>{local(item, "description", locale)}</p>
        </>
      )}
      <CardButton item={item} locale={locale} />
      <CardMedia item={item} locale={locale} position="bottom" />
    </article>
  );
}

function NestedGrid({
  locale,
  allItems,
  items,
  columns,
  depth,
  parent,
}: {
  locale: Locale;
  allItems: SiteItem[];
  items: SiteItem[];
  columns: number;
  depth: number;
  parent?: SiteItem;
}) {
  const actualColumns = useColumns(columns),
    editing = useCmsEditMode();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const rows: SiteItem[][] = [];
  for (let index = 0; index < items.length; index += actualColumns)
    rows.push(items.slice(index, index + actualColumns));
  return (
    <div
      className="nested-grid-wrap"
      style={{ "--nested-columns": columns } as React.CSSProperties}
    >
      {!items.length && editing && (
        <p className="empty-child-groups">
          {locale === "he"
            ? "אין עדיין תתי־קבוצות"
            : "لا توجد مجموعات فرعية بعد"}
        </p>
      )}
      {rows.map((row, rowIndex) => {
        const expanded = visibleId
          ? items.find((item) => item.id === visibleId)
          : undefined;
        const expandedIndex = expanded
          ? row.findIndex((item) => item.id === expanded.id)
          : -1;
        const children = expanded
          ? allItems.filter((item) => item.parent_id === expanded.id)
          : [];
        const parentTitle = expanded ? local(expanded, "title", locale) : "";
        return (
          <div
            className="nested-grid-row-group"
            key={`${depth}-${rowIndex}`}
            style={
              expandedIndex >= 0
                ? ({
                    "--nested-connector-x": `${((expandedIndex + 0.5) / actualColumns) * 100}%`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <div className="content-list nested-grid-row">
              {row.map((item) => {
                const itemChildren = allItems.filter(
                  (candidate) => candidate.parent_id === item.id,
                );
                return (
                  <CmsCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    childItems={itemChildren}
                    depth={depth}
                    expanded={expandedId === item.id}
                    onToggle={() => {
                      if (expandedId === item.id) {
                        setExpandedId(null);
                        window.setTimeout(
                          () =>
                            setVisibleId((current) =>
                              current === item.id ? null : current,
                            ),
                          250,
                        );
                      } else {
                        setVisibleId(item.id);
                        setExpandedId(item.id);
                      }
                    }}
                  />
                );
              })}
            </div>
            {expanded &&
              row.some((item) => item.id === expanded.id) &&
              (children.length || editing) && (
                <section
                  id={`child-groups-${expanded.id}`}
                  className={`nested-child-region ${expandedId === expanded.id ? "is-open" : "is-closing"}`}
                  aria-label={
                    locale === "he" ? "תתי־קבוצות" : "المجموعות الفرعية"
                  }
                >
                  <h3 className="nested-region-heading">
                  </h3>
                  <NestedGrid
                    locale={locale}
                    allItems={allItems}
                    items={children}
                    columns={Math.min(
                      4,
                      Math.max(1, Number(expanded.settings?.childColumns) || 3),
                    )}
                    depth={depth + 1}
                    parent={expanded}
                  />
                </section>
              )}
          </div>
        );
      })}
      {editing && parent && !expandedId && (
        <div className="nested-add-card">
          <AddItemCard
            locale={locale}
            sectionId={parent.section_id}
            parentId={parent.id}
            compact
            label={
              locale === "he"
                ? `הוסף תת־קבוצה ל״${local(parent, "title", locale)}״`
                : `إضافة مجموعة فرعية إلى «${local(parent, "title", locale)}»`
            }
          />
        </div>
      )}
    </div>
  );
}

export function ExpandableCardGrid({
  locale,
  items,
  columns,
  addLabel,
  sectionId,
}: {
  locale: Locale;
  items: SiteItem[];
  columns: number;
  addLabel: string;
  sectionId: string;
}) {
  return (
    <div
      className="expandable-card-collection"
      style={{ "--nested-columns": columns } as React.CSSProperties}
    >
      <NestedGrid
        locale={locale}
        allItems={items}
        items={items.filter((item) => !item.parent_id)}
        columns={columns}
        depth={0}
      />
      <div className="content-list nested-grid-row cms-top-level-add">
        <AddItemCard locale={locale} sectionId={sectionId} label={addLabel} />
      </div>
    </div>
  );
}
