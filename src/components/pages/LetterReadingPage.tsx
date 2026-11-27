import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { ProtectedWorksheetButton } from "@/components/worksheets/ProtectedWorksheet";
import styles from "./LetterGroupsPage.module.css";

export function LetterReadingPage({ locale, title, image, id }: {
  locale: Locale;
  title: string;
  image?: string;
  id: string;
}) {
  return (
    <figure className={image ? styles.readerPage : styles.readerLinkPage}>
      <ProtectedWorksheetButton
        locale={locale}
        title={title}
        id={id}
        className={`nav-action-control ${styles.readerOpen}`}
      >
        {image && (
          <Image src={image} alt="" width={560} height={790}
            sizes="(max-width: 700px) 92vw, 560px" unoptimized />
        )}
        <span>{title}</span>
      </ProtectedWorksheetButton>
    </figure>
  );
}
