"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { findLetterGroup } from "./letter-group-search";
import styles from "./LetterGroupsPage.module.css";

export function LetterGroupSearch({ locale, groups }: {
  locale: Locale;
  groups: ReadonlyArray<{ id: string; he: string; ar: string }>;
}) {
  const router = useRouter();
  const id = useId();
  const [query, setQuery] = useState("");
  const he = locale === "he";
  const groupId = findLetterGroup(query);
  const group = groups.find((item) => item.id === groupId);
  const href = group ? `/${locale}/letters?group=${group.id}` : undefined;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!href) return;
    router.push(href);
    setQuery("");
  };

  return (
    <form className={styles.letterSearch} role="search" onSubmit={submit}>
      <label htmlFor={id}>{he ? "חיפוש קבוצה לפי אות" : "البحث عن مجموعة حسب الحرف"}</label>
      <div className={styles.letterSearchControl}>
        <input id={id} type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          dir="auto" autoComplete="off" maxLength={32}
          placeholder={he ? "למשל ב או ب" : "مثل ب أو باء"} />
        <button type="submit" className="nav-action-control" disabled={!href}>
          <Search size={17} aria-hidden="true" />
          {he ? "הצגת הקבוצה" : "عرض المجموعة"}
        </button>
      </div>
      <div aria-live="polite">
        {group && href ? (
          <Link href={href} onClick={() => setQuery("")}>{group[locale]}</Link>
        ) : query.trim() ? (
          <span>{he ? "לא נמצאה קבוצה. נסו אות אחת או את שמה." : "لم نجد مجموعة مطابقة. جرّبوا إدخال حرف واحد أو اسمه."}</span>
        ) : null}
      </div>
    </form>
  );
}
