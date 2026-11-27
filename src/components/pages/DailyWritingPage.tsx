"use client";

import Image from "next/image";
import { BookUser, CakeSlice, PawPrint, Printer, ShoppingBasket, Utensils } from "lucide-react";
import { PageIntro } from "@/components/layout/PageIntro";
import { PageHomeNavigation } from "@/components/navigation/PageHomeNavigation";
import { useWorksheetViewer } from "@/components/worksheets/ProtectedWorksheet";
import { dailyWritingActivities, dailyWritingTitle } from "@/data/daily-writing";
import type { Locale } from "@/i18n/config";
import styles from "./DailyWritingPage.module.css";

const icons = {
  "restaurant-menu": Utensils,
  "shopping-list": ShoppingBasket,
  "phone-book": BookUser,
  zoo: PawPrint,
  "birthday-invitation": CakeSlice,
};

export function DailyWritingPage({ locale }: { locale: Locale }) {
  const he = locale === "he";
  const { open, viewer } = useWorksheetViewer(locale);
  return (
    <div className="page-shell container content-page">
      <PageHomeNavigation locale={locale} />
      <PageIntro title={dailyWritingTitle[locale]} eyebrow={he ? "תרגול כתיבה" : "تدريب على الكتابة"}
        description={he ? "חמש פעילויות לתרגול כתיבה במצבים מוכרים מחיי היום־יום." : "خمس أنشطة لممارسة الكتابة في مواقف مألوفة من الحياة اليومية. أوراق الأنشطة بالعبرية."} />
      <div className={styles.grid}>
        {dailyWritingActivities.map((activity) => {
          const title = activity[locale];
          const id = `daily-writing-${activity.id}`;
          const Icon = icons[activity.id];
          return (
            <article className={`cms-card ${styles.card}`} key={id} data-tone={activity.tone}>
              <button type="button" className={`nav-action-control ${styles.preview}`}
                aria-label={`${he ? "צפייה" : "عرض"} · ${title}`} onClick={() => open(id, title)}>
                <Image src={`/daily-writing/${activity.id}.webp`} alt="" width={460} height={650}
                  sizes="(max-width: 36rem) 80vw, (max-width: 60rem) 42vw, 270px" unoptimized />
              </button>
              <div className={styles.details}>
                <div className={styles.heading}><span className={styles.icon}><Icon size={20} aria-hidden="true" /></span><h2>{title}</h2></div>
                <div className={styles.actions}>
                  <button type="button" className="outline-button" onClick={() => open(id, title)}>{he ? "צפייה" : "عرض"}</button>
                  <button type="button" className="button" onClick={() => open(id, title, true)}>
                    <Printer size={17} aria-hidden="true" />{he ? "הדפסה" : "طباعة"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {viewer}
    </div>
  );
}
