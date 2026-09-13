export const fontPresets = {
  heebo: {
    key: "heebo",
    labelHe: "Heebo",
    labelAr: "Heebo",
    he: "var(--font-heebo)",
    ar: "var(--font-noto-arabic)",
  },
  assistant: {
    key: "assistant",
    labelHe: "Assistant",
    labelAr: "Assistant",
    he: "var(--font-assistant)",
    ar: "var(--font-noto-arabic)",
  },
  alef: {
    key: "alef",
    labelHe: "Alef",
    labelAr: "Alef",
    he: "var(--font-alef)",
    ar: "var(--font-cairo)",
  },
  "noto-sans-hebrew": {
    key: "noto-sans-hebrew",
    labelHe: "Noto Sans Hebrew",
    labelAr: "Noto Sans Hebrew",
    he: "var(--font-noto-hebrew)",
    ar: "var(--font-noto-arabic)",
  },
  playpen: {
    key: "playpen",
    labelHe: "Playpen Sans Hebrew",
    labelAr: "Playpen Sans Hebrew",
    he: "var(--font-playpen-hebrew)",
    ar: "var(--font-cairo)",
  },
} as const;

export type FontPresetKey = keyof typeof fontPresets;

export const defaultFontPreset: FontPresetKey = "heebo";

export function isFontPresetKey(value: string): value is FontPresetKey {
  return value in fontPresets;
}

/** Keeps existing theme JSON valid without writing to production data. */
export function normalizeFontPreset(value: string): FontPresetKey {
  if (value === "rubik") return "alef";
  return isFontPresetKey(value) ? value : defaultFontPreset;
}
