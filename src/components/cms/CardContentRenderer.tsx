"use client";

import type { Locale } from "@/i18n/config";
import {
  DEFAULT_BLOCK_STYLES,
  type CardStyle,
  type ContentBlock,
  type TextBlockStyle,
  resolveCardStyle,
  resolveTextBlockStyle,
  resolveTitleStyle,
} from "./card-content";

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
  const style = resolveCardStyle(cardStyle);
  const resolvedTitle = resolveTitleStyle(titleStyle, style);
  const titleClasses = classNames(
    "card-content__title",
    "card-content__align--" + resolvedTitle.align,
    "card-content__text--" + resolvedTitle.size,
    resolvedTitle.bold && "is-bold",
    resolvedTitle.underline && "is-underlined",
  );
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
            width: block.media.width ?? DEFAULT_BLOCK_STYLES.image.width,
            fit: block.media.fit ?? DEFAULT_BLOCK_STYLES.image.fit,
            align: block.media.align ?? DEFAULT_BLOCK_STYLES.image.align,
          };
          const mediaClasses = classNames(
            "card-content__media",
            "card-content__media--" + image.width,
            "card-content__align--" + image.align,
          );
          const imageElement = (
            <img
              className={"card-content__image card-content__image--fit-" + image.fit}
              src={block.media.url}
              alt=""
            />
          );
          return <div key={block.id} className={mediaClasses}>{imageElement}</div>;
        }
        if (block.type === "pdf") {
          // The public document affordance is rendered once by CardFooter.
          return null;
        }
        if (block.type === "button") {
          if (!block.href && !block[locale]) return null;
          return <span key={block.id} className={"card-content__button card-content__align--" + style.align}>{block[locale] || (locale === "he" ? "כפתור" : "زر")}</span>;
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
    </div>
  );
}
