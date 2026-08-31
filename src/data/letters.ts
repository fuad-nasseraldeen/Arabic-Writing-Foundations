export type ArabicLetter = { slug: string; letter: string; nameArabic: string; forms: { isolated: string; initial: string; medial: string; final: string }; group: string; visualFeatures: string[]; motorRequirements: string[]; spatialRequirements: string[]; cognitiveRequirements: string[]; commonDifficulties: { id: string; title: string; strategy: string }[] };
export const letterGroups = [
  { id: "dots", title: "משפחת הנקודות", description: "טיוטת ארגון לפי מבנה בסיסי משותף ומיקום הנקודות.", letters: ["ب", "ت", "ث"] },
  { id: "bowls", title: "קווים וקערות", description: "טיוטת ארגון לפי כיוון התנועה והמבנה החזותי.", letters: ["ح", "ج", "خ"] },
  { id: "upright", title: "צורות אנכיות", description: "טיוטת ארגון לפי קו בסיס ותנועה אנכית.", letters: ["ا", "ل", "ك"] },
];
export const letters: ArabicLetter[] = [{
  slug: "baa", letter: "ب", nameArabic: "الباء", group: "משפחת הנקודות", forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
  visualFeatures: ["גוף האות בעל קו בסיס וקערה פתוחה", "נקודה אחת מתחת לגוף האות", "דמיון חזותי לאותיות ت ו־ث", "הצורה משתנה בהתאם למיקום במילה"],
  motorRequirements: ["תנועה רציפה לאורך קו בסיס", "שליטה בהוספת נקודה נפרדת"], spatialRequirements: ["שמירה על מיקום הנקודה מתחת לגוף", "ארגון האות ביחס לשורה"], cognitiveRequirements: ["זכירת רצף רכיבי האות", "הבחנה בין אותיות מאותה משפחה"],
  commonDifficulties: [
    { id: "dot", title: "שוכח את הנקודה", strategy: "אפשרו סימון מודגש של שלב הנקודה ותרגלו הפרדה בין גוף האות להוספת הפרט." },
    { id: "place", title: "ממקם את הנקודה במקום לא נכון", strategy: "השתמשו בקו עזר ובשפה עקבית: הנקודה נמצאת מתחת לגוף האות." },
    { id: "confuse", title: "מבלבל בין ب / ت / ث", strategy: "עבדו על השוואה חזותית ממוקדת של מספר ומיקום הנקודות." },
    { id: "copy", title: "מצליח להעתיק אך מתקשה בכתיבה עצמאית", strategy: "צמצמו בהדרגה את הרמז החזותי ועברו להיזכרות מונחית." },
    { id: "connect", title: "מתקשה בחיבור האות בתוך מילה", strategy: "תרגלו תחילה זוגות אותיות קצרים תוך הדגשת נקודת החיבור." }
  ]
}];
