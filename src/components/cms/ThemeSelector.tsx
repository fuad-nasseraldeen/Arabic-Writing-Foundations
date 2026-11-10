"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { saveTheme } from "@/app/[locale]/admin/actions";
import { textScaleTokens } from "./themePresets";
import { fontPresets, type FontPresetKey } from "./fontPresets";

function applyLocalTheme(
  textScale: keyof typeof textScaleTokens,
  fontPreset: FontPresetKey,
) {
  const scale = textScaleTokens[textScale];
  Object.entries(scale).forEach(([name, value]) => document.documentElement.style.setProperty(`--text-${name === "display" ? "display" : name}`, value));
  const font = fontPresets[fontPreset];
  document.documentElement.style.setProperty("--font-site-he", font.he);
  document.documentElement.style.setProperty("--font-site-ar", font.ar);
}

export function ThemeSelector({ locale, activeTextScale, activeFontPreset }: { locale: Locale; activeTextScale: keyof typeof textScaleTokens; activeFontPreset: FontPresetKey }) {
  const router = useRouter();
  const [activeScale, setActiveScale] = useState(activeTextScale);
  const [activeFont, setActiveFont] = useState(activeFontPreset);
  const [textScale, setTextScale] = useState(activeTextScale);
  const [fontPreset, setFontPreset] = useState(activeFontPreset);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<"success" | "error" | null>(null);
  const dirty = textScale !== activeScale || fontPreset !== activeFont;

  const selectTextScale = (scale: keyof typeof textScaleTokens) => {
    if (saving) return;
    setTextScale(scale);
    applyLocalTheme(scale, fontPreset);
  };
  const selectFontPreset = (key: FontPresetKey) => {
    if (saving) return;
    setFontPreset(key);
    applyLocalTheme(textScale, key);
  };
  const apply = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.set("theme_key", "original");
      formData.set("text_scale", textScale);
      formData.set("font_preset", fontPreset);
      formData.set("accent_preset", "teal");
      await saveTheme(locale, formData);
      applyLocalTheme(textScale, fontPreset);
      setActiveScale(textScale);
      setActiveFont(fontPreset);
      setNotice("success");
      window.setTimeout(() => setNotice(null), 2800);
      router.refresh();
    } catch {
      applyLocalTheme(activeScale, activeFont);
      setTextScale(activeScale);
      setFontPreset(activeFont);
      setNotice("error");
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => {
    if (saving) return;
    setTextScale(activeScale);
    setFontPreset(activeFont);
    applyLocalTheme(activeScale, activeFont);
  };

  return <section className="theme-selector" aria-busy={saving}>
    <div className="font-setting">
      <h2>{locale === "he" ? "גופן" : "الخط"}</h2>
      <div className="font-presets" role="radiogroup" aria-label={locale === "he" ? "בחירת גופן" : "اختيار الخط"}>
        {Object.values(fontPresets).map((preset) => {
          const isSelected = fontPreset === preset.key;
          const isActive = activeFont === preset.key;
          return <button key={preset.key} type="button" role="radio" aria-checked={isSelected} disabled={saving} onClick={() => selectFontPreset(preset.key)} className={`font-preset ${isSelected ? "selected" : ""} ${isActive ? "active-font" : ""}`}>
            <b>{locale === "he" ? preset.labelHe : preset.labelAr}</b>
            <small>{isActive ? (locale === "he" ? "פעיל" : "نشط") : isSelected ? (locale === "he" ? "נבחר" : "مُختار") : (locale === "he" ? "לבחירה" : "للاختيار")}</small>
          </button>;
        })}
      </div>
    </div>
    <div className="theme-apply-row">
      <label className="editor-select"><span>{locale === "he" ? "גודל טקסט" : "حجم النص"}</span><select disabled={saving} value={textScale} onChange={(event) => selectTextScale(event.target.value as keyof typeof textScaleTokens)}><option value="compact">{locale === "he" ? "קומפקטי" : "مضغوط"}</option><option value="normal">{locale === "he" ? "רגיל" : "عادي"}</option><option value="large">{locale === "he" ? "גדול" : "كبير"}</option></select></label>
      {dirty && <button type="button" className="outline-button" disabled={saving} onClick={cancel}>{locale === "he" ? "ביטול" : "إلغاء"}</button>}
      <button type="button" className="button" disabled={!dirty || saving} onClick={apply}>{saving && <LoaderCircle className="theme-spinner" size={17} />}{saving ? (locale === "he" ? "שומר את העיצוב…" : "جارٍ حفظ التصميم…") : (locale === "he" ? "שמירת העיצוב" : "حفظ التصميم")}</button>
    </div>
    {saving && <div className="theme-loading"><LoaderCircle className="theme-spinner" size={20} /><span>{locale === "he" ? "שומר את העיצוב…" : "جارٍ حفظ التصميم…"}</span></div>}
    {notice && <div className={`cms-toast ${notice === "error" ? "error" : ""}`} role="status">{notice === "success" ? (locale === "he" ? "העיצוב עודכן" : "تم تحديث التصميم") : (locale === "he" ? "לא ניתן היה לעדכן. נסו שוב." : "تعذر التحديث. حاولوا مرة أخرى.")}</div>}
  </section>;
}
