import { rainMaterials, rainStages } from "@/components/pages/rain-materials";
import type { FilterGroup, FilterOption, Worksheet, WorksheetLibraryData } from "./worksheet-types";
import type { Locale } from "@/i18n/config";

const arabicWorksheets = new Set([
  "stage-1-worksheet-1",
  "stage-1-worksheet-2",
  "stage-1-worksheet-3",
]);

const rainOption: FilterOption = {
  id: "bundled-letter-group-rain", group_id: "bundled-letter-group", key: "rain",
  label_he: "קבוצת הגשם", label_ar: "مجموعة المطر", sort_order: 0, is_visible: true,
};

const group: FilterGroup = {
  id: rainOption.group_id, key: "letter-group", label_he: "קבוצת אותיות", label_ar: "مجموعة الحروف",
  selection_mode: "single", sort_order: 0, is_visible: true, options: [rainOption],
};
const stageGroup: FilterGroup = {
  id: "bundled-stage", key: "stage", label_he: "שלב", label_ar: "المرحلة",
  selection_mode: "single", sort_order: 1, is_visible: true,
  options: rainStages.map((stage, index) => ({
    id: `bundled-stage-${index + 1}`, group_id: "bundled-stage", key: String(index + 1),
    label_he: `שלב ${index + 1} · ${stage.he}`, label_ar: `المرحلة ${index + 1} · ${stage.ar}`,
    sort_order: index, is_visible: true,
  })),
};

function mergeFilterGroup(bundled: FilterGroup, existing?: FilterGroup): FilterGroup {
  if (!existing) return bundled;
  const options = [...existing.options];
  for (const option of bundled.options) {
    if (!options.some(({ key }) => key === option.key)) {
      options.push({ ...option, group_id: existing.id });
    }
  }
  return { ...existing, options };
}

export function withRainWorksheets(data: WorksheetLibraryData, locale: Locale): WorksheetLibraryData {
  const letterGroupFilter = mergeFilterGroup(group, data.filterGroups.find(({ key }) => key === group.key));
  const stageFilter = mergeFilterGroup(stageGroup, data.filterGroups.find(({ key }) => key === stageGroup.key));
  const rainOptionId = letterGroupFilter.options.find(({ key }) => key === rainOption.key)!.id;
  const stageOptionIds = new Map(stageFilter.options.map(({ key, id }) => [key, id]));
  const worksheetOptionIds = { ...data.worksheetOptionIds };
  const rainSheets: Worksheet[] = [];
  for (const item of rainMaterials) {
    if (item.kind !== "worksheet") continue;
    const id = `rain-${item.id}`;
    if (locale === "ar" && !arabicWorksheets.has(item.id)) continue;
    const folder = `/letter-groups/rain/${item.id}`;
    const arabicFile = `/letter-groups/rain/ar/${item.id}.png`;
    worksheetOptionIds[id] = [rainOptionId, stageOptionIds.get(String(item.stage))!];
    rainSheets.push({
      id, title_he: item.he, title_ar: item.ar,
      description_he: null, description_ar: null,
      therapeutic_goal_he: null, therapeutic_goal_ar: null,
      letter_group_id: null,
      thumbnail_url: locale === "ar" ? arabicFile : `${folder}-preview.webp`,
      file_url: locale === "ar" ? arabicFile : `${folder}.webp`,
      file_type: "image", original_file_name: null, is_visible: true, sort_order: rainSheets.length,
      created_at: "2026-11-24T00:00:00Z", updated_at: "2026-11-24T00:00:00Z", bundled: true,
    });
  }
  return {
    ...data,
    worksheets: [...rainSheets, ...data.worksheets],
    filterGroups: [letterGroupFilter, stageFilter, ...data.filterGroups.filter(({ key }) => key !== group.key && key !== stageGroup.key)],
    worksheetOptionIds,
  };
}
