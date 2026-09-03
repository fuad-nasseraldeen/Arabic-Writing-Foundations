import {
  BookOpen,
  BrainCircuit,
  Leaf,
  Lightbulb,
  Pencil,
  Star,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getFeaturedWeeklyTip, localWeeklyTip } from "@/lib/weekly-tips";

const icons = {
  lightbulb: Lightbulb,
  leaf: Leaf,
  brain: BrainCircuit,
  star: Star,
  pencil: Pencil,
  book: BookOpen,
};

export async function WeeklyTipPage({ locale }: { locale: Locale }) {
  const tip = await getFeaturedWeeklyTip();
  const isHe = locale === "he";
  if (!tip)
    return (
      <div className="weekly-tip-page container">
        <span className="eyebrow">
          {isHe ? "כלי קטן לשבוע הקרוב" : "أداة صغيرة للأسبوع القادم"}
        </span>
        <h1>{isHe ? "טיפ השבוע" : "نصيحة الأسبوع"}</h1>
        <section className="weekly-tip-empty">
          <Lightbulb aria-hidden="true" />
          <h2>
            {isHe ? "טיפ חדש יופיע כאן בקרוב" : "ستظهر هنا نصيحة جديدة قريباً"}
          </h2>
          <p>
            {isHe
              ? "אין כרגע טיפים פעילים להצגה."
              : "لا توجد نصائح نشطة للعرض حالياً."}
          </p>
        </section>
      </div>
    );
  const text = localWeeklyTip(tip, locale);
  const Icon = icons[tip.icon_key] || Lightbulb;
  return (
    <div className="weekly-tip-page container">
      <span className="eyebrow">
        {isHe ? "כלי קטן לשבוע הקרוב" : "أداة صغيرة للأسبوع القادم"}
      </span>
      <h1>{isHe ? "טיפ השבוע" : "نصيحة الأسبوع"}</h1>
      <article className="weekly-tip-feature">
        <div className="weekly-tip-icon">
          <Icon aria-hidden="true" size={33} />
        </div>
        {tip.category && (
          <span className="weekly-tip-category">{tip.category}</span>
        )}
        <h2>{text.title}</h2>
        <p>{text.description}</p>
      </article>
    </div>
  );
}
