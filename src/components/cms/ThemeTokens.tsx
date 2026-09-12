import { getDesignSettings, type DesignSettings } from "@/lib/cms";
import { textScaleTokens, themeNames, themeTokens } from "./themePresets";
export { themeNames } from "./themePresets";
export async function ThemeTokens({
  settings: provided,
}: {
  settings?: DesignSettings;
}) {
  const settings = provided || (await getDesignSettings());
  const scale = textScaleTokens[settings.textScale];
  const themeCss = Object.entries(
    themeTokens[settings.themeKey] || themeTokens.original,
  )
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  const typeCss = `--text-xs:${scale.xs};--text-sm:${scale.sm};--text-base:${scale.base};--text-lg:${scale.lg};--text-xl:${scale.xl};--text-2xl:${scale.xxl};--text-display:${scale.display}`;
  return <style>{`:root{${themeCss};${typeCss}}`}</style>;
}
