import { getActiveTheme } from "@/lib/cms";
import { themeNames, themeTokens } from "./themePresets";
export { themeNames } from "./themePresets";
export async function ThemeTokens(){const key=await getActiveTheme();const css=Object.entries(themeTokens[key]||themeTokens.original).map(([name,value])=>`${name}:${value}`).join(";");return <style>{`:root{${css}}`}</style>;}
