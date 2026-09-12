import { getDesignSettings, type DesignSettings } from "@/lib/cms";
import { themeNames, themeTokens } from "./themePresets";
export { themeNames } from "./themePresets";
const scales = {
  compact: {
    xs: "0.75rem",
    sm: "0.8125rem",
    base: "0.9375rem",
    lg: "1.0625rem",
    xl: "1.25rem",
    xxl: "1.75rem",
    display: "clamp(2rem, 4vw, 3rem)",
  },
  normal: {
    xs: "0.8125rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.3125rem",
    xxl: "1.875rem",
    display: "clamp(2.25rem, 4.2vw, 3.25rem)",
  },
  large: {
    xs: "0.875rem",
    sm: "0.9375rem",
    base: "1.0625rem",
    lg: "1.1875rem",
    xl: "1.4375rem",
    xxl: "2.0625rem",
    display: "clamp(2.5rem, 4.5vw, 3.5rem)",
  },
};
export async function ThemeTokens({
  settings: provided,
}: {
  settings?: DesignSettings;
}) {
  const settings = provided || (await getDesignSettings());
  const scale = scales[settings.textScale];
  const themeCss = Object.entries(
    themeTokens[settings.themeKey] || themeTokens.original,
  )
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  const typeCss = `--text-xs:${scale.xs};--text-sm:${scale.sm};--text-base:${scale.base};--text-lg:${scale.lg};--text-xl:${scale.xl};--text-2xl:${scale.xxl};--text-display:${scale.display}`;
  return <style>{`:root{${themeCss};${typeCss}}`}</style>;
}
