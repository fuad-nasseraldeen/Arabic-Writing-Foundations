"use client";

import { Search } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { findLetter } from "./letter-group-search";
import styles from "./LetterGroupsPage.module.css";

const copy = {
  he: { label: "הקלידו אות בערבית או את שמה", submit: "חיפוש", empty: "לא נמצאה אות תואמת." },
  ar: { label: "أدخلوا حرفًا عربيًا أو اسمه", submit: "بحث", empty: "لم نجد حرفًا مطابقًا." },
};

export function ArabicLetterSearch({ locale }: { locale: Locale }) {
  const id = useId();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const letter = findLetter(query);
  const labels = copy[locale];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(input.trim());
  }

  return (
    <form className={styles.letterSearch} role="search" onSubmit={submit}>
      <label htmlFor={id}>{labels.label}</label>
      <div className={styles.letterSearchControl}>
        <input id={id} type="search" value={input} onChange={(event) => {
          setInput(event.target.value);
          setQuery("");
        }} dir="auto" autoComplete="off" maxLength={32} />
        <button className="nav-action-control" type="submit" disabled={!input.trim()}>
          <Search size={17} aria-hidden="true" />
          {labels.submit}
        </button>
      </div>
      <div aria-live="polite">
        {letter ? (
          <p className={styles.letterResult} lang="ar" dir="rtl">
            <strong>{letter.letter}</strong>
            <span>{letter.name}</span>
          </p>
        ) : query ? <span>{labels.empty}</span> : null}
      </div>
    </form>
  );
}
