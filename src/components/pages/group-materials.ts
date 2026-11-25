import { rainMaterials, rainSkills, rainStages } from "./rain-materials";

export const letterGroups = [
  { id: "rain", he: "קבוצת הגשם", ar: "مجموعة المطر" },
  { id: "wheel", he: "קבוצת הגלגל", ar: "مجموعة العجلة" },
  { id: "soup", he: "קבוצת המרקיה", ar: "مجموعة صحن الشوربة" },
  { id: "slide", he: "קבוצת המגלשה", ar: "مجموعة الزحليقة" },
  { id: "butterfly", he: "קבוצת הפרפר", ar: "مجموعة الفراشة" },
  { id: "egg", he: "קבוצת הביצה", ar: "مجموعة البيضة" },
] as const;

type GroupId = typeof letterGroups[number]["id"];
type Localized = { he: string; ar: string };
export type GroupMaterial = Localized & (
  | { id: string; kind: "guide" | "ideas"; stage?: number }
  | { id: string; kind: "worksheet"; stage: number }
);

const stageSkills = [
  ["movement", "movement", "recognition"],
  ["initial", "initial"],
  ["tracing", "tracing", "copying", "copying"],
  ["recall", "dictation"],
] as const;

const wordSkills = ["forms", "missing", "words"] as const;

function materialsFor(letters: string[], headings = rainStages): GroupMaterial[] {
  const worksheets = [
    ...stageSkills.map((skills) => skills.map((skill) => rainSkills[skill])),
    letters.flatMap((letter) => wordSkills.map((skill) => ({
      he: `${rainSkills[skill].he} · ${letter}`,
      ar: `${rainSkills[skill].ar} · ${letter}`,
    }))),
  ];
  return [
    { id: "introduction-1", kind: "guide", he: "היכרות עם קבוצת האותיות ומטרות התרגול", ar: "التعرّف على مجموعة الحروف وأهداف التدريب" },
    { id: "introduction-2", kind: "guide", he: "רצף הלמידה ודגשים למרפאות בעיסוק", ar: "تسلسل التعلم وإرشادات للعلاج الوظيفي" },
    ...headings.flatMap((title, index): GroupMaterial[] => {
      const stage = index + 1;
      return [
        { id: `stage-${stage}-guide`, kind: "guide", stage, ...title },
        { id: `stage-${stage}-ideas`, kind: "ideas", stage, ...title },
        ...worksheets[index].map((labels, index): GroupMaterial => ({
          id: `stage-${stage}-worksheet-${index + 1}`,
          kind: "worksheet",
          stage,
          ...labels,
          ...(stage < 5 && { he: `${labels.he} · ${index + 1}`, ar: `${labels.ar} · ${index + 1}` }),
        })),
      ];
    }),
  ];
}

export const groupMaterials: Record<GroupId, GroupMaterial[]> = {
  rain: rainMaterials,
  wheel: materialsFor(["م", "و", "ه", "ف", "ق"]),
  soup: materialsFor(["س", "ش", "ن"]),
  slide: materialsFor(["د", "ذ", "ر", "ز"]),
  butterfly: materialsFor(["ج", "ح", "خ", "ع", "غ", "ي"]),
  egg: materialsFor(["ص", "ض", "ط", "ظ"]),
};
