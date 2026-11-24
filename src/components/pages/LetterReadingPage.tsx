import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { DocumentPreviewButton } from "@/components/worksheets/DocumentPreview";
import styles from "./LetterGroupsPage.module.css";

export function LetterReadingPage({ locale, title, image, document = image }: {
  locale: Locale;
  title: string;
  image?: string;
  document?: string;
}) {
  if (!document) return null;

  return (
    <figure className={image ? styles.readerPage : styles.readerLinkPage}>
      <DocumentPreviewButton
        locale={locale}
        title={title}
        url={document}
        pdf={document.endsWith(".pdf")}
        className={styles.readerOpen}
      >
        {image && (
          <Image src={image} alt={title} width={923} height={1305}
            sizes="(max-width: 700px) 92vw, 680px" unoptimized />
        )}
        <span>{title}</span>
      </DocumentPreviewButton>
    </figure>
  );
}
