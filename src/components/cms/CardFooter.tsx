import { FileText } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { ContentBlock, MediaContentBlock } from "./card-content";

export function CardFooter({
  blocks,
  locale,
  childCount,
  showItemCount,
}: {
  blocks: ContentBlock[];
  locale: Locale;
  childCount: number;
  showItemCount: boolean;
}) {
  const document = blocks.find(
    (block): block is MediaContentBlock => block.type === "pdf" && Boolean(block.media.url),
  );
  const label = document?.media.displayName || (locale === "he" ? "צפייה במסמך" : "عرض المستند");
  return <footer className="cms-card__footer">
    <span className="cms-card__footer-slot cms-card__footer-slot--document">
      {document && <span className="cms-card__document"><FileText size={17} />{label}</span>}
    </span>
    <span className="cms-card__footer-slot cms-card__footer-slot--count">
      {childCount > 0 && showItemCount && <span className="cms-card__count">{childCount} {locale === "he" ? "פריטים" : "عناصر"}</span>}
    </span>
  </footer>;
}
