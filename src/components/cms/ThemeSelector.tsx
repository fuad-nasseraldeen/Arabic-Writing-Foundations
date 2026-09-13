"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { saveTheme } from "@/app/[locale]/admin/actions";
import { accentPresets, baseThemePresets, getColorTokens, textScaleTokens, type AccentPresetKey } from "./themePresets";
import { fontPresets, type FontPresetKey } from "./fontPresets";

function applyLocalTheme(
  key: string,
  textScale: keyof typeof textScaleTokens,
  fontPreset: FontPresetKey,
  accentPreset: AccentPresetKey,
) {
  Object.entries(getColorTokens(key, accentPreset)).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
  const scale = textScaleTokens[textScale];
  Object.entries(scale).forEach(([name, value]) => document.documentElement.style.setProperty(`--text-${name === "display" ? "display" : name}`, value));
  const font = fontPresets[fontPreset];
  document.documentElement.style.setProperty("--font-site-he", font.he);
  document.documentElement.style.setProperty("--font-site-ar", font.ar);
}

export function ThemeSelector({ locale, activeTheme, activeTextScale, activeFontPreset, activeAccentPreset }: { locale: Locale; activeTheme: string; activeTextScale: keyof typeof textScaleTokens; activeFontPreset: FontPresetKey; activeAccentPreset: AccentPresetKey }) {
  const router = useRouter();
  const [active, setActive] = useState(activeTheme);
  const [activeScale, setActiveScale] = useState(activeTextScale);
  const [activeFont, setActiveFont] = useState(activeFontPreset);
  const [activeAccent, setActiveAccent] = useState(activeAccentPreset);
  const [selected, setSelected] = useState(activeTheme);
  const [textScale, setTextScale] = useState(activeTextScale);
  const [fontPreset, setFontPreset] = useState(activeFontPreset);
  const [accentPreset, setAccentPreset] = useState(activeAccentPreset);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<"success" | "error" | null>(null);
  const dirty = selected !== active || textScale !== activeScale || fontPreset !== activeFont || accentPreset !== activeAccent;

  const selectTheme = (key: string) => {
    if (saving) return;
    setSelected(key);
    applyLocalTheme(key, textScale, fontPreset, accentPreset);
  };
  const selectTextScale = (scale: keyof typeof textScaleTokens) => {
    if (saving) return;
    setTextScale(scale);
    applyLocalTheme(selected, scale, fontPreset, accentPreset);
  };
  const selectFontPreset = (key: FontPresetKey) => {
    if (saving) return;
    setFontPreset(key);
    applyLocalTheme(selected, textScale, key, accentPreset);
  };
  const selectAccentPreset = (key: AccentPresetKey) => {
    if (saving) return;
    setAccentPreset(key);
    applyLocalTheme(selected, textScale, fontPreset, key);
  };

  const apply = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.set("theme_key", selected);
      formData.set("text_scale", textScale);
      formData.set("font_preset", fontPreset);
      formData.set("accent_preset", accentPreset);
      await saveTheme(locale, formData);
      applyLocalTheme(selected, textScale, fontPreset, accentPreset);
      setActive(selected);
      setActiveScale(textScale);
      setActiveFont(fontPreset);
      setActiveAccent(accentPreset);
      setNotice("success");
      window.setTimeout(() => setNotice(null), 2800);
      router.refresh();
    } catch {
      applyLocalTheme(active, activeScale, activeFont, activeAccent);
      setSelected(active);
      setTextScale(activeScale);
      setFontPreset(activeFont);
      setAccentPreset(activeAccent);
      setNotice("error");
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => {
    if (saving) return;
    setSelected(active);
    setTextScale(activeScale);
    setFontPreset(activeFont);
    setAccentPreset(activeAccent);
    applyLocalTheme(active, activeScale, activeFont, activeAccent);
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
    <div className="base-theme-setting">
      <h2>{locale === "he" ? "ערכת עיצוב" : "قالب التصميم"}</h2>
      <div className="theme-presets">
      {Object.entries(baseThemePresets).map(([key, preset]) => {
        const isActive = active === key;
        const isSelected = selected === key;
        return <button key={key} type="button" disabled={saving} onClick={() => selectTheme(key)} className={`theme-preview ${isSelected ? "selected" : ""} ${isActive ? "active-theme" : ""}`} style={{ "--preview-page": preset.tokens["--color-page"], "--preview-surface": preset.tokens["--color-surface"], "--preview-soft": preset.tokens["--color-surface-soft"] } as CSSProperties}>
          <span className="preview-swatch" /><b>{locale === "he" ? preset.labelHe : preset.labelAr}</b>
          {isActive ? <small className="theme-state active"><Check size={14} />{locale === "he" ? "פעיל" : "نشط"}</small> : isSelected ? <small className="theme-state selected"><Check size={14} />{locale === "he" ? "נבחר" : "مُختار"}</small> : <small>{locale === "he" ? "לבחירה" : "للاختيار"}</small>}
        </button>;
      })}
      </div>
    </div>
    <div className="accent-setting">
      <h2>{locale === "he" ? "צבע הדגשה" : "لون التمييز"}</h2>
      <div className="accent-presets" role="radiogroup" aria-label={locale === "he" ? "בחירת צבע הדגשה" : "اختيار لون التمييز"}>
        {Object.entries(accentPresets).map(([key, preset]) => <button key={key} type="button" role="radio" aria-checked={accentPreset === key} disabled={saving} onClick={() => selectAccentPreset(key as AccentPresetKey)} className={`accent-preset ${accentPreset === key ? "selected" : ""}`}><i style={{ background: preset.tokens["--color-accent"] }} /><span>{locale === "he" ? preset.labelHe : preset.labelAr}</span></button>)}
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
