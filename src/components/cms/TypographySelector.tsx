"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { saveTypography } from "@/app/[locale]/admin/actions";

const copy = {
  he: {
    font: "גופן",
    scale: "גודל טקסט",
    apply: "שמור",
    saving: "שומר…",
    clean: "נקי",
    soft: "רך",
    modern: "מודרני",
    compact: "קומפקטי",
    normal: "רגיל",
    large: "גדול",
    done: "העיצוב עודכן",
    error: "לא ניתן היה לעדכן. נסו שוב.",
  },
  ar: {
    font: "الخط",
    scale: "حجم النص",
    apply: "حفظ",
    saving: "جارٍ الحفظ…",
    clean: "Clean",
    soft: "Soft",
    modern: "Modern",
    compact: "مضغوط",
    normal: "عادي",
    large: "كبير",
    done: "تم تحديث الطباعة",
    error: "تعذر التحديث. حاولوا مرة أخرى.",
  },
};
const fonts = {
  clean: ["var(--font-heebo)", "var(--font-noto-arabic)"],
  soft: ["var(--font-assistant)", "var(--font-noto-arabic)"],
  modern: ["var(--font-rubik)", "var(--font-cairo)"],
} as const;
const scales = {
  compact: [
    ".9375rem",
    ".8125rem",
    "1.0625rem",
    "1.25rem",
    "1.75rem",
    "clamp(2rem,4vw,3rem)",
  ],
  normal: [
    "1rem",
    ".875rem",
    "1.125rem",
    "1.3125rem",
    "1.875rem",
    "clamp(2.25rem,4.2vw,3.25rem)",
  ],
  large: [
    "1.0625rem",
    ".9375rem",
    "1.1875rem",
    "1.4375rem",
    "2.0625rem",
    "clamp(2.5rem,4.5vw,3.5rem)",
  ],
} as const;
function preview(preset: keyof typeof fonts, scale: keyof typeof scales) {
  const root = document.documentElement,
    [he, ar] = fonts[preset],
    [base, sm, lg, xl, xxl, display] = scales[scale];
  root.style.setProperty("--font-body", `${he},Arial,sans-serif`);
  root.style.setProperty("--font-arabic-body", `${ar},Arial,sans-serif`);
  [
    ["--text-base", base],
    ["--text-sm", sm],
    ["--text-lg", lg],
    ["--text-xl", xl],
    ["--text-2xl", xxl],
    ["--text-display", display],
  ].forEach(([key, value]) => root.style.setProperty(key, value));
}
export function TypographySelector({
  locale,
  activePreset,
  activeScale,
}: {
  locale: Locale;
  activePreset: "clean" | "soft" | "modern";
  activeScale: "compact" | "normal" | "large";
}) {
  const router = useRouter(),
    l = copy[locale];
  const [preset, setPreset] = useState(activePreset),
    [scale, setScale] = useState(activeScale),
    [saving, setSaving] = useState(false),
    [notice, setNotice] = useState<"success" | "error" | null>(null);
  const dirty = preset !== activePreset || scale !== activeScale;
  const submit = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.set("typography_preset", preset);
      form.set("text_scale", scale);
      await saveTypography(locale, form);
      setNotice("success");
      router.refresh();
    } catch {
      setNotice("error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="typography-selector" aria-busy={saving}>
      <fieldset>
        <legend>{l.font}</legend>
        <div className="typography-options">
          {(["clean", "soft", "modern"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPreset(key);
                preview(key, scale);
              }}
              className={preset === key ? "selected" : ""}
              aria-pressed={preset === key}
            >
              {l[key]}
              {preset === key && <Check size={15} />}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{l.scale}</legend>
        <div className="typography-options">
          {(["compact", "normal", "large"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setScale(key);
                preview(preset, key);
              }}
              className={scale === key ? "selected" : ""}
              aria-pressed={scale === key}
            >
              {l[key]}
              {scale === key && <Check size={15} />}
            </button>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        className="button"
        disabled={!dirty || saving}
        onClick={submit}
      >
        {saving && <LoaderCircle className="theme-spinner" size={17} />}{" "}
        {saving ? l.saving : l.apply}
      </button>
      {notice && (
        <div
          className={`cms-toast ${notice === "error" ? "error" : ""}`}
          role="status"
        >
          {notice === "success" ? l.done : l.error}
        </div>
      )}
    </section>
  );
}
