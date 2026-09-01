import type { Metadata } from "next";
import { Heebo, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
const heebo = Heebo({ subsets: ["hebrew"], variable: "--font-heebo" });
const arabic = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });
export const metadata: Metadata = { title: "קדם־כתיבה בערבית | מדריך מקצועי", description: "מדריך דיגיטלי מקצועי לקידום מיומנויות קדם־כתיבה ורכישת כתיבת אותיות בערבית בקרב ילדים בגילאי 4–7." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html dir="rtl" data-scroll-behavior="smooth"><body className={`${heebo.variable} ${arabic.variable}`}>{children}</body></html>; }
