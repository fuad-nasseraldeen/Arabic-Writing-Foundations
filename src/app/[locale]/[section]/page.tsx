import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
import { LocalizedContentPage } from "@/components/pages/LocalizedContentPage";
import { LocalizedWorksheetPage } from "@/components/pages/LocalizedWorksheetPage";
import { isAdmin } from "@/lib/auth";
const entries = {
 letters: { he:["מפת אותיות","קבוצות חזותיות","ניתוח אות"], ar:["خريطة الحروف","مجموعات بصرية","تحليل الحرف"] },
 worksheets: { he:["קווים קדם־כתיבתיים","תרגול נקודות","עקיבה אחר אות","העתקה מדורגת"], ar:["خطوط تمهيدية للكتابة","تمارين النقاط","تتبع الحرف","نسخ متدرج"] },
 resources: { he:["כלים להדרכה","חומרים לצוותים","מקורות מקצועיים"], ar:["أدوات للإرشاد","مواد للفرق","مصادر مهنية"] },
 "weekly-tip": { he:["טיפ מקצועי שבועי"], ar:["نصيحة مهنية أسبوعية"] },
 project: { he:["מטרת המיזם","המסגרת האקדמית","המשך הדרך"], ar:["هدف المشروع","الإطار الأكاديمي","الخطوات القادمة"] },
 about: { he:["היכרות מקצועית","הגישה המקצועית"], ar:["تعارف مهني","المنهج المهني"] },
 skills: { he:["מיומנויות מוטוריות","תכנון תנועה","מוכנות לכתיבה"], ar:["مهارات حركية","تخطيط الحركة","الاستعداد للكتابة"] },
 strategies: { he:["התאמת פעילות","תרגול מדורג","תצפית ומשוב"], ar:["ملاءمة النشاط","تدريب متدرج","ملاحظة وتغذية راجعة"] }
} as const;
export default async function Page({params}:{params:Promise<{locale:string;section:string}>}) { const {locale,section}=await params; if(!isLocale(locale) || !(section in entries)) notFound(); const admin=await isAdmin(); if(section==="worksheets") return <LocalizedWorksheetPage locale={locale} isAdmin={admin}/>; const d=t(locale); const key=section === "weekly-tip" ? "weeklyTip" : section as keyof typeof d.nav; const title=d.nav[key] || (locale==="he"?"מיומנויות":"المهارات"); return <LocalizedContentPage locale={locale} title={title} eyebrow={locale==="he"?"המדריך המקצועי":"الدليل المهني"} items={[...entries[section as keyof typeof entries][locale]]} pageKey={section} isAdmin={admin}/>; }
