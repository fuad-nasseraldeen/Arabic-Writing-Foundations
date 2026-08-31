export const locales = ["he", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "he";
export function isLocale(value: string): value is Locale { return locales.includes(value as Locale); }
