import type { Metadata } from "next";
import {
  Cairo,
  Heebo,
  Noto_Sans_Arabic,
} from "next/font/google";
import "./globals.css";
import "./interactions.css";
import "./button-shape.css";
import { ThemeTokens } from "@/components/cms/ThemeTokens";
import { getDesignSettings } from "@/lib/cms";
const heebo = Heebo({
  subsets: ["hebrew"],
  variable: "--font-heebo",
  display: "swap",
});
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
});
const cairo = Cairo({
  subsets: ["arabic"],
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
    <html dir="rtl" data-scroll-behavior="smooth">
      <body
        className={`${heebo.variable} ${notoArabic.variable} ${cairo.variable}`}
      >
        <ThemeTokens settings={design} />
        {children}
      </body>
    </html>
  );
}
