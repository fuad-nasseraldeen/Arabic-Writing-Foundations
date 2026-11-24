import { rainMaterials, rainStages } from "@/components/pages/rain-materials";
import type { FilterGroup, FilterOption, Worksheet, WorksheetLibraryData } from "./worksheet-types";

const taxonomy = {
  movement: { skill: ["line-control", "pre-writing-lines", "directionality"], activity: ["tracing"] },
  recognition: { skill: ["visual-discrimination"], activity: ["visual-discrimination"] },
  initial: { skill: ["visual-discrimination", "letter-writing"], activity: ["matching", "independent-writing"] },
  tracing: { skill: ["tracing", "letter-writing", "visual-motor-integration"], activity: ["tracing"] },
  copying: { skill: ["letter-writing", "visual-motor-integration"], activity: ["copying"] },
  recall: { skill: ["letter-writing"], activity: ["independent-writing"] },
  dictation: { skill: ["letter-writing"], activity: ["independent-writing"] },
  forms: { skill: ["letter-writing", "letter-connection"], activity: ["independent-writing"] },
  missing: { skill: ["letter-writing", "letter-connection"], activity: ["completion"] },
  words: { skill: ["letter-writing", "letter-connection"], activity: ["copying"] },
};

const rainOption: FilterOption = {
  id: "bundled-letter-group-rain", group_id: "bundled-letter-group", key: "rain",
  label_he: "קבוצת הגשם", label_ar: "مجموعة المطر", sort_order: 0, is_visible: true,
};

const group: FilterGroup = {
  id: rainOption.group_id, key: "letter-group", label_he: "קבוצת אותיות", label_ar: "مجموعة الحروف",
  selection_mode: "multi", sort_order: 0, is_visible: true, options: [rainOption],
};

export function withRainWorksheets(data: WorksheetLibraryData): WorksheetLibraryData {
  const optionIds = new Map(data.filterGroups.flatMap(({ key, options }) =>
    options.map((option) => [`${key}:${option.key}`, option.id])));
  const worksheetOptionIds = { ...data.worksheetOptionIds };
  const rainSheets: Worksheet[] = [];
  for (const item of rainMaterials) {
    if (item.kind !== "worksheet") continue;
    const id = `rain-${item.id}`;
    const folder = `/letter-groups/rain/${item.id}`;
    const stage = rainStages[item.stage - 1];
    const tags = {
      ...taxonomy[item.skill],
      difficulty: [item.stage <= 2 ? "easy" : item.stage === 3 ? "medium" : "hard"],
      age: item.stage === 1 ? ["4-5", "5-6"] : item.stage <= 3 ? ["5-6", "6-7"] : ["6-7"],
    };
    if (item.id === "stage-2-worksheet-1") {
      tags.skill = ["visual-discrimination"];
      tags.activity = ["matching", "visual-discrimination"];
    }
    if (item.id === "stage-2-worksheet-2") {
      tags.skill = ["letter-writing"];
      tags.activity = ["independent-writing"];
    }
    worksheetOptionIds[id] = [rainOption.id, ...Object.entries(tags).flatMap(([key, values]) =>
      values.flatMap((value) => optionIds.get(`${key}:${value}`) ?? []))];
    rainSheets.push({
      id, title_he: item.he, title_ar: item.ar,
      description_he: `שלב ${item.stage} · ${stage.he}`,
      description_ar: `المرحلة ${item.stage} · ${stage.ar}`,
      therapeutic_goal_he: null, therapeutic_goal_ar: null,
      letter_group_id: null, thumbnail_url: `${folder}-preview.webp`, file_url: `${folder}.webp`,
      file_type: "image", original_file_name: null, is_visible: true, sort_order: rainSheets.length,
      created_at: "2026-11-24T00:00:00Z", updated_at: "2026-11-24T00:00:00Z", bundled: true,
    });
  }
  return {
    ...data, worksheets: [...rainSheets, ...data.worksheets], filterGroups: [group, ...data.filterGroups], worksheetOptionIds,
  };
}
