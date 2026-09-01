"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { saveTheme } from "@/app/[locale]/admin/actions";
import { themeNames, themeTokens } from "./themePresets";

function applyLocalTheme(key: string) {
  Object.entries(themeTokens[key] || themeTokens.original).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
}

export function ThemeSelector({ locale, activeTheme }: { locale: Locale; activeTheme: string }) {
  const router = useRouter();
  const [active, setActive] = useState(activeTheme);
  const [selected, setSelected] = useState(activeTheme);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<"success" | "error" | null>(null);
  const dirty = selected !== active;

  useEffect(() => {
    setActive(activeTheme);
    setSelected(activeTheme);
  }, [activeTheme]);

  useEffect(() => () => applyLocalTheme(active), [active]);

  const selectTheme = (key: string) => {
    if (saving) return;
    setSelected(key);
    applyLocalTheme(key);
  };

  const apply = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.set("theme_key", selected);
      await saveTheme(locale, formData);
      setActive(selected);
      setNotice("success");
      window.setTimeout(() => setNotice(null), 2800);
      router.refresh();
    } catch {
      applyLocalTheme(active);
      setSelected(active);
      setNotice("error");
    } finally {
      setSaving(false);
    }
  };

  return <section className="theme-selector" aria-busy={saving}>
    <div className="theme-presets">
      {Object.entries(themeNames).map(([key, name]) => {
        const isActive = active === key;
        const isSelected = selected === key;
        return <button key={key} type="button" disabled={saving} onClick={() => selectTheme(key)} className={`theme-preview ${isSelected ? "selected" : ""} ${isActive ? "active-theme" : ""}`}>
          <span className={`preview-swatch ${key}`} /><b>{name}</b>
          {isActive ? <small className="theme-state active"><Check size={14} />{locale === "he" ? "פעיל" : "نشط"}</small> : isSelected ? <small className="theme-state selected"><Check size={14} />{locale === "he" ? "נבחר" : "مُختار"}</small> : <small>{locale === "he" ? "לבחירה" : "للاختيار"}</small>}
        </button>;
      })}
    </div>
    <div className="theme-apply-row">
      <button type="button" className="button" disabled={!dirty || saving} onClick={apply}>{saving && <LoaderCircle className="theme-spinner" size={17} />}{saving ? (locale === "he" ? "מעדכן ערכת צבעים…" : "جارٍ تحديث النمط…") : (locale === "he" ? "החל ערכת צבעים" : "تطبيق نمط الألوان")}</button>
    </div>
    {saving && <div className="theme-loading"><LoaderCircle className="theme-spinner" size={20} /><span>{locale === "he" ? "מעדכן את מראה האתר…" : "جارٍ تحديث مظهر الموقع…"}</span></div>}
    {notice && <div className={`cms-toast ${notice === "error" ? "error" : ""}`} role="status">{notice === "success" ? (locale === "he" ? "ערכת הצבעים עודכנה" : "تم تحديث نمط الألوان") : (locale === "he" ? "לא ניתן היה לעדכן. נסו שוב." : "تعذر التحديث. حاولوا مرة أخرى.")}</div>}
  </section>;
}
