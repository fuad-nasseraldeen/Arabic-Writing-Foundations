import type { Metadata } from "next";
import {
  Alef,
  Assistant,
  Cairo,
  Heebo,
  Noto_Sans_Arabic,
  Noto_Sans_Hebrew,
  Playpen_Sans_Hebrew,
} from "next/font/google";
import "./globals.css";
import "./interactions.css";
import "./button-shape.css";
import { ThemeTokens } from "@/components/cms/ThemeTokens";
import { getDesignSettings } from "@/lib/cms";
const heebo = Heebo({
  subsets: ["hebrew"],
  weight: "variable",
  variable: "--font-heebo",
  display: "swap",
});
const assistant = Assistant({
  subsets: ["hebrew"],
  weight: "variable",
  variable: "--font-assistant",
  display: "swap",
});
const alef = Alef({
  subsets: ["hebrew"],
  weight: ["400", "700"],
  variable: "--font-alef",
  display: "swap",
});
const notoHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: "variable",
  variable: "--font-noto-hebrew",
  display: "swap",
});
const playpenHebrew = Playpen_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: "variable",
  variable: "--font-playpen-hebrew",
  display: "swap",
});
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: "variable",
  variable: "--font-noto-arabic",
  display: "swap",
});
const cairo = Cairo({
  subsets: ["arabic"],
  weight: "variable",
  variable: "--font-cairo",
  display: "swap",
});
export const metadata: Metadata = {
  title: "קדם־כתיבה בערבית | מדריך מקצועי",
  description:
    "מדריך דיגיטלי מקצועי לקידום מיומנויות קדם־כתיבה ורכישת כתיבת אותיות בערבית בקרב ילדים בגילאי 4–7.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const design = await getDesignSettings();
  return (
    <html
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${heebo.variable} ${assistant.variable} ${alef.variable} ${notoHebrew.variable} ${playpenHebrew.variable} ${notoArabic.variable} ${cairo.variable}`}
    >
      <body>
        <ThemeTokens settings={design} />
        {children}
      </body>
    </html>
  );
}
