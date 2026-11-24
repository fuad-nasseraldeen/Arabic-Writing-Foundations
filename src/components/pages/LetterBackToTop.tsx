"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import styles from "./LetterGroupsPage.module.css";

export function LetterBackToTop({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);
  const label = locale === "he" ? "חזרה לראש העמוד" : "العودة إلى أعلى الصفحة";

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 480);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <button type="button" className={`nav-action-control ${styles.backToTop}`}
      data-visible={visible} tabIndex={visible ? undefined : -1} aria-hidden={!visible}
      aria-label={label} title={label}
      onClick={() => {
        document.getElementById("letter-page-top")?.focus({ preventScroll: true });
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
      }}>
      <ArrowUp size={20} aria-hidden="true" />
    </button>
  );
}
