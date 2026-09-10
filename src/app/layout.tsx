import type { Metadata } from "next";
import {
  Assistant,
  Cairo,
  Heebo,
  Noto_Sans_Arabic,
  Rubik,
} from "next/font/google";
import "./globals.css";
import "./interactions.css";
import "./button-shape.css";
// Presets are selected with CSS variables. Fonts are self-hosted by next/font,
// so changing a preset never adds a client-side request or layout shift.
const heebo = Heebo({
  subsets: ["hebrew"],
  variable: "--font-heebo",
  display: "swap",
});
const assistant = Assistant({
  subsets: ["hebrew"],
  variable: "--font-assistant",
  display: "swap",
});
const rubik = Rubik({
  subsets: ["hebrew"],
  variable: "--font-rubik",
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
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html dir="rtl" data-scroll-behavior="smooth">
      <body
        className={`${heebo.variable} ${assistant.variable} ${rubik.variable} ${notoArabic.variable} ${cairo.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
