type Localized = { he: string; ar: string };

export const rainLetters = ["ا", "ب", "ت", "ث", "ك", "ل"] as const;

export const rainStages = [
  { he: "היכרות ותנועה", ar: "التعرّف والحركة" },
  { he: "מודעות פונולוגית", ar: "الوعي الصوتي" },
  { he: "כתיבה מודרכת", ar: "الكتابة الموجّهة" },
  { he: "כתיבה עצמאית ושליפה מהזיכרון", ar: "الكتابة المستقلة والاسترجاع من الذاكرة" },
  { he: "צורות האותיות במילה", ar: "أشكال الحروف في الكلمة" },
] as const;

export const rainSkills = {
  movement: { he: "תרגול תנועה וקווים", ar: "التدرّب على الحركة والخطوط" },
  recognition: { he: "זיהוי אותיות", ar: "تمييز الحروف" },
  initial: { he: "צליל ואות פותחת", ar: "الصوت والحرف الأول" },
  tracing: { he: "מעבר על אותיות", ar: "تتبّع الحروف" },
  copying: { he: "העתקת אותיות", ar: "نسخ الحروف" },
  recall: { he: "כתיבה מהזיכרון", ar: "الكتابة من الذاكرة" },
  dictation: { he: "כתיבה משמיעה", ar: "الإملاء" },
  forms: { he: "כתיבת צורות האות במילה", ar: "كتابة أشكال الحرف في الكلمة" },
  missing: { he: "השלמת אות חסרה", ar: "إكمال الحرف الناقص" },
  words: { he: "קריאה והעתקת מילים", ar: "قراءة الكلمات ونسخها" },
} satisfies Record<string, Localized>;

type Skill = keyof typeof rainSkills;
type MaterialBase = Localized & { id: string };
export type RainMaterial = MaterialBase & (
  | { kind: "guide" | "ideas"; stage?: number }
  | { kind: "worksheet"; stage: number; skill: Skill; letters: readonly string[] }
);

function worksheet(
  stage: number,
  number: number,
  skill: Skill,
  he: string,
  ar: string,
  letters: readonly string[] = rainLetters,
): RainMaterial {
  return { id: `stage-${stage}-worksheet-${number}`, kind: "worksheet", stage, skill, he, ar, letters };
}

const wordSheets = [
  [1, "ا", "forms"], [2, "ا", "missing"], [3, "ا", "words"],
  [4, "ب", "missing"], [5, "ب", "words"],
  [6, "ت", "forms"], [7, "ت", "missing"], [8, "ب", "forms"], [9, "ت", "words"],
  [10, "ث", "forms"], [11, "ث", "missing"], [12, "ث", "words"],
  [13, "ك", "forms"], [14, "ك", "missing"], [15, "ك", "words"],
  [16, "ل", "forms"], [17, "ل", "missing"], [18, "ل", "words"],
] as const;

export const rainMaterials: RainMaterial[] = [
  { id: "main", kind: "guide", he: "מפת האותיות של קבוצת הגשם", ar: "خريطة حروف مجموعة المطر" },
  { id: "introduction-1", kind: "guide", he: "היכרות עם קבוצת הגשם ומטרות התרגול", ar: "التعرّف على مجموعة المطر وأهداف التدريب" },
  { id: "introduction-2", kind: "guide", he: "רצף הלמידה ודגשים למרפאות בעיסוק", ar: "تسلسل التعلم وإرشادات للعلاج الوظيفي" },
  ...rainStages.flatMap((title, index): RainMaterial[] => {
    const stage = index + 1;
    return [
      { id: `stage-${stage}-guide`, kind: "guide", stage, ...title },
      { id: `stage-${stage}-ideas`, kind: "ideas", stage, ...title },
    ];
  }),
  worksheet(1, 1, "movement", "מעבר על קווים אנכיים", "تتبّع الخطوط العمودية", []),
  worksheet(1, 2, "movement", "השלמת קווים מלמעלה למטה", "إكمال الخطوط من الأعلى إلى الأسفل", []),
  worksheet(1, 3, "recognition", "מציאה וצביעה של אותיות קבוצת הגשם", "إيجاد حروف مجموعة المطر وتلوينها"),
  worksheet(2, 1, "initial", "הקפת האות הפותחת של כל תמונה", "تحديد الحرف الأول لكل صورة"),
  worksheet(2, 2, "initial", "כתיבת האות הפותחת של כל תמונה", "كتابة الحرف الأول لكل صورة"),
  worksheet(3, 1, "tracing", "מעבר על מסלול האותיות", "تتبّع مسار الحروف"),
  worksheet(3, 2, "tracing", "מעבר על אותיות מקווקוות במטריות", "تتبّع الحروف المنقّطة في المظلات"),
  worksheet(3, 3, "copying", "העתקת האות לכפפה הריקה", "نسخ الحرف في القفاز الفارغ"),
  worksheet(3, 4, "copying", "העתקת האות בכל שורה", "نسخ الحرف في كل سطر"),
  worksheet(4, 1, "recall", "כתיבה מהזיכרון בתוך הכובעים", "كتابة الحروف من الذاكرة داخل القبّعات"),
  worksheet(4, 2, "dictation", "האזנה וכתיבת האות בענן", "الاستماع وكتابة الحرف داخل الغيمة"),
  ...wordSheets.map(([number, letter, skill]) =>
    worksheet(5, number, skill, `${rainSkills[skill].he} · ${letter}`, `${rainSkills[skill].ar} · ${letter}`, [letter])),
];
