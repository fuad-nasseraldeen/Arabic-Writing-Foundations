import { getDesignSettings, type DesignSettings } from "@/lib/cms";
import { getColorTokens, textScaleTokens } from "./themePresets";
import { fontPresets } from "./fontPresets";
export async function ThemeTokens({
  settings: provided,
}: {
  settings?: DesignSettings;
}) {
  const settings = provided || (await getDesignSettings());
  const scale = textScaleTokens[settings.textScale];
  const font = fontPresets[settings.fontPreset];
  const themeCss = Object.entries(getColorTokens(settings.themeKey, settings.accentPreset))
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  const typeCss = `--text-xs:${scale.xs};--text-sm:${scale.sm};--text-base:${scale.base};--text-lg:${scale.lg};--text-xl:${scale.xl};--text-2xl:${scale.xxl};--text-display:${scale.display};--font-site-he:${font.he};--font-site-ar:${font.ar}`;
  return <style>{`:root{${themeCss};${typeCss}}`}</style>;
}
