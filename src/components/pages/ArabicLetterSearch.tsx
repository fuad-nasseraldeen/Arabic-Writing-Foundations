"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { findLetters } from "./letter-group-search";
import styles from "./LetterGroupsPage.module.css";

const copy = {
  he: { label: "הקלידו אותיות בערבית או שם של אות", empty: "לא נמצאה אות תואמת." },
  ar: { label: "أدخلوا حروفًا عربية أو اسم حرف", empty: "لم نجد حرفًا مطابقًا." },
};

export function ArabicLetterSearch({ locale, groups }: {
  locale: Locale;
  groups: ReadonlyArray<{ id: string; he: string; ar: string }>;
}) {
  const id = useId();
  const [input, setInput] = useState("");
  const letters = findLetters(input);
  const labels = copy[locale];

  return (
    <div className={styles.letterSearch} role="search">
      <label htmlFor={id}>{labels.label}</label>
      <div className={styles.letterSearchControl}>
        <input id={id} type="search" value={input} onChange={(event) => setInput(event.target.value)}
          dir="auto" autoComplete="off" maxLength={32} />
      </div>
      <div aria-live="polite">
        {letters.map(({ letter, name, group }, index) => (
          <Link key={`${letter}-${index}`} className={styles.letterResult} href={`/${locale}/letters?view=group&group=${group}`}>
            <strong lang="ar">{letter}</strong>
            <span lang="ar" dir="rtl">{name}</span>
            <span>{groups.find(({ id }) => id === group)?.[locale]}</span>
          </Link>
        ))}
        {input.trim() && letters.length === 0 && <span>{labels.empty}</span>}
      </div>
    </div>
  );
}
