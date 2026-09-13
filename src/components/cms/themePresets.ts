export const baseThemePresets = {
  original: { labelHe: "מקורית", labelAr: "الأصلية", tokens: { "--color-page": "#fbf8f0", "--color-surface": "#fffdfa", "--color-surface-soft": "#dcebe2", "--color-border": "#e7e3d8", "--color-text": "#193545", "--color-text-muted": "#60727a", "--color-header-surface": "#fffdfa", "--color-decoration-peach": "#f7ded2", "--color-decoration-lavender": "#e6e1f1", "--color-decoration-yellow": "#f8edc8" } },
  white: { labelHe: "לבן נקי", labelAr: "أبيض نقي", tokens: { "--color-page": "#fafcfc", "--color-surface": "#ffffff", "--color-surface-soft": "#e5f0ee", "--color-border": "#e2e8eb", "--color-text": "#203443", "--color-text-muted": "#65737e", "--color-header-surface": "#ffffff", "--color-decoration-peach": "#f6e9e2", "--color-decoration-lavender": "#ecebf3", "--color-decoration-yellow": "#f9f1d8" } },
  "soft-blue": { labelHe: "כחול רך", labelAr: "أزرق هادئ", tokens: { "--color-page": "#f3f8fb", "--color-surface": "#ffffff", "--color-surface-soft": "#dcecef", "--color-border": "#dce8ef", "--color-text": "#203747", "--color-text-muted": "#617786", "--color-header-surface": "#ffffff", "--color-decoration-peach": "#f4e6df", "--color-decoration-lavender": "#e3e9f4", "--color-decoration-yellow": "#f7efd2" } },
  "soft-lavender": { labelHe: "לבנדר רך", labelAr: "لافندر هادئ", tokens: { "--color-page": "#f8f6fb", "--color-surface": "#fffefe", "--color-surface-soft": "#e4eee8", "--color-border": "#e7e3ee", "--color-text": "#343448", "--color-text-muted": "#6d6c7c", "--color-header-surface": "#fffefe", "--color-decoration-peach": "#f5e4df", "--color-decoration-lavender": "#e9e3f2", "--color-decoration-yellow": "#f8efd4" } },
  "warm-beige": { labelHe: "בז׳ חם", labelAr: "بيج دافئ", tokens: { "--color-page": "#fbf8f1", "--color-surface": "#fffdf9", "--color-surface-soft": "#e5ecdf", "--color-border": "#e9e2d6", "--color-text": "#37443c", "--color-text-muted": "#6e756d", "--color-header-surface": "#fffdf9", "--color-decoration-peach": "#f6e3d4", "--color-decoration-lavender": "#eae4ed", "--color-decoration-yellow": "#f7edc9" } },
} as const;

export const accentPresets = {
  teal: { labelHe: "טורקיז", labelAr: "فيروزي", tokens: { "--color-accent": "#39716a", "--color-accent-hover": "#285a55", "--color-accent-soft": "#dcebe2", "--color-accent-border": "#5f9189", "--color-on-accent": "#ffffff" } },
  blue: { labelHe: "כחול", labelAr: "أزرق", tokens: { "--color-accent": "#356b8a", "--color-accent-hover": "#28546d", "--color-accent-soft": "#dceaf2", "--color-accent-border": "#6d9db8", "--color-on-accent": "#ffffff" } },
  lavender: { labelHe: "לבנדר", labelAr: "لافندر", tokens: { "--color-accent": "#665f88", "--color-accent-hover": "#514c70", "--color-accent-soft": "#e8e3f2", "--color-accent-border": "#928bb0", "--color-on-accent": "#ffffff" } },
  peach: { labelHe: "אפרסק", labelAr: "خوخي", tokens: { "--color-accent": "#9a5c45", "--color-accent-hover": "#7d4936", "--color-accent-soft": "#f6e2d8", "--color-accent-border": "#c98b73", "--color-on-accent": "#ffffff" } },
  charcoal: { labelHe: "פחם", labelAr: "فحمي", tokens: { "--color-accent": "#394b55", "--color-accent-hover": "#293942", "--color-accent-soft": "#e2e8ea", "--color-accent-border": "#71828a", "--color-on-accent": "#ffffff" } },
} as const;

export type BaseThemeKey = keyof typeof baseThemePresets;
export type AccentPresetKey = keyof typeof accentPresets;
export const defaultAccentPreset: AccentPresetKey = "teal";

export const sharedDesignTokens = {
  "--color-danger": "#9d4545",
  "--color-danger-soft": "#fff1ef",
  "--color-danger-border": "#efc4bd",
  "--color-overlay": "rgb(25 53 69 / .42)",
  "--shadow": "0 12px 35px rgb(42 67 63 / 8%)",
  "--shadow-sm": "0 3px 12px rgb(25 53 69 / 0.045)",
  "--shadow-md": "0 12px 30px rgb(25 53 69 / 0.09)",
  "--shadow-button": "0 1px 2px rgb(25 53 69 / .10)",
  "--shadow-button-hover": "0 7px 16px rgb(25 53 69 / .16)",
} as const;

export function isAccentPresetKey(value: string): value is AccentPresetKey {
  return value in accentPresets;
}

export const textScaleTokens = {
  compact: { xs: "0.75rem", sm: "0.8125rem", base: "0.9375rem", lg: "1.0625rem", xl: "1.25rem", xxl: "1.75rem", display: "clamp(2rem, 4vw, 3rem)" },
  normal: { xs: "0.8125rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.3125rem", xxl: "1.875rem", display: "clamp(2.25rem, 4.2vw, 3.25rem)" },
  large: { xs: "0.875rem", sm: "0.9375rem", base: "1.0625rem", lg: "1.1875rem", xl: "1.4375rem", xxl: "2.0625rem", display: "clamp(2.5rem, 4.5vw, 3.5rem)" },
} as const;

export function getColorTokens(themeKey: string, accentKey: AccentPresetKey) {
  return { ...sharedDesignTokens, ...(baseThemePresets[themeKey as BaseThemeKey] || baseThemePresets.original).tokens, ...accentPresets[accentKey].tokens };
}
