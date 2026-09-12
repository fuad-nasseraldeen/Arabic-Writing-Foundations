"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText } from "lucide-react";
import type { Locale } from "@/i18n/config";
import {
  DEFAULT_BLOCK_STYLES,
  type CardStyle,
  type ContentBlock,
  type TextBlockStyle,
  resolveCardStyle,
  resolveDocumentStyle,
  resolveTextBlockStyle,
  resolveTitleStyle,
} from "./card-content";
import { MediaViewer } from "./CardMedia";

type Props = {
  title: { he: string; ar: string };
  blocks: ContentBlock[];
  cardStyle?: CardStyle;
  titleStyle?: TextBlockStyle;
  locale: Locale;
  preview?: boolean;
};

const classNames = (...values: Array<string | false | undefined>) =>
  values.filter(Boolean).join(" ");

export function CardContentRenderer({
  title,
  blocks,
  cardStyle,
  titleStyle = {},
  locale,
  preview = false,
}: Props) {
  const [openMedia, setOpenMedia] = useState<{
    url: string;
    title: string;
    isPdf: boolean;
  } | null>(null);
  const style = resolveCardStyle(cardStyle);
  const resolvedTitle = resolveTitleStyle(titleStyle, style);
  const titleClasses = classNames(
    "card-content__title",
    "card-content__align--" + resolvedTitle.align,
    "card-content__text--" + resolvedTitle.size,
    resolvedTitle.bold && "is-bold",
    resolvedTitle.underline && "is-underlined",
  );
  const fileLabel = locale === "he" ? "צפייה במסמך" : "عرض المستند";
  return (
    <div
      className={classNames(
        "card-content",
        "card-content--align-" + style.align,
        "card-content--background-" + style.background,
        "card-content--border-" + style.border,
        "card-content--density-" + style.density,
        preview && "card-content--preview-shell",
      )}
      dir="rtl"
    >
      {title[locale] && (
        <h2 className={titleClasses}>{title[locale]}</h2>
      )}
      {blocks.map((block) => {
        if (block.type === "image") {
          if (!block.media.url) return null;
          const image = {
            width: block.media.width || DEFAULT_BLOCK_STYLES.image.width,
            fit: block.media.fit || DEFAULT_BLOCK_STYLES.image.fit,
            align: block.media.align || DEFAULT_BLOCK_STYLES.image.align,
          };
          const imageTitle = locale === "he" ? "תמונה" : "صورة";
          const mediaClasses = classNames(
            "card-content__media",
            "card-content__media--" + image.width,
            "card-content__align--" + image.align,
            !preview && "card-content__media--interactive interactive-button",
          );
          const imageElement = (
            <img
              className={"card-content__image card-content__image--fit-" + image.fit}
              src={block.media.url}
              alt=""
            />
          );
          return preview ? (
            <div key={block.id} className={mediaClasses}>{imageElement}</div>
          ) : (
            <button
              key={block.id}
              type="button"
              className={mediaClasses}
              aria-label={imageTitle}
              onClick={(event) => {
                event.stopPropagation();
                setOpenMedia({ url: block.media.url, title: imageTitle, isPdf: false });
              }}
            >
              {imageElement}
            </button>
          );
        }
        if (block.type === "pdf") {
          if (!block.media.url) return null;
          const pdfAlign = block.media.align || DEFAULT_BLOCK_STYLES.pdf.align;
          const pdfTitle = block.media.displayName || fileLabel;
          const pdf = <><FileText size={20} />{pdfTitle}</>;
          const classes = classNames(
            "card-content__document",
            "interactive-button",
            "card-content__document--" + resolveDocumentStyle(block),
            "card-content__document--tone-" + (block.media.tone ?? DEFAULT_BLOCK_STYLES.pdf.tone),
            "card-content__align--" + pdfAlign,
            block.media.bold && "is-bold",
          );
          return preview ? (
            <div key={block.id} className={classes}>{pdf}</div>
          ) : (
            <button
              key={block.id}
              type="button"
              className={classes}
              onClick={(event) => {
                event.stopPropagation();
                setOpenMedia({ url: block.media.url, title: pdfTitle, isPdf: true });
              }}
            >
              {pdf}
            </button>
          );
        }
        if (block.type === "button") {
          if (!block.href && !block[locale]) return null;
          return preview
            ? <span key={block.id} className={"card-content__button card-content__align--" + style.align}>{block[locale] || (locale === "he" ? "כפתור" : "زر")}</span>
            : block.href ? <Link key={block.id} className={"card-content__button button interactive-button card-content__align--" + style.align} href={block.href} onClick={(event) => event.stopPropagation()}>{block[locale]}</Link> : null;
        }
        const textBlock = block as import("./card-content").TextContentBlock;
        const text = resolveTextBlockStyle(textBlock, style);
        const classes = classNames(
          "card-content__block",
          "card-content__block--" + textBlock.type,
          "card-content__align--" + text.align,
          "card-content__text--" + text.size,
          "card-content__space--" + text.spacing,
          text.bold && "is-bold",
          text.underline && "is-underlined",
        );
        if (!textBlock[locale]) return null;
        return <div key={textBlock.id} className={classes}>{textBlock.type === "subheading" ? <h3>{textBlock[locale]}</h3> : textBlock.type === "source" ? <small>{textBlock[locale]}</small> : <p>{textBlock[locale]}</p>}</div>;
      })}
      {openMedia && (
        <MediaViewer
          url={openMedia.url}
          title={openMedia.title}
          isPdf={openMedia.isPdf}
          locale={locale}
          onClose={() => setOpenMedia(null)}
        />
      )}
    </div>
  );
}
