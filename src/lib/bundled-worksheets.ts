import { groupMaterials, letterGroups } from "@/components/pages/group-materials";
import { rainStages } from "@/components/pages/rain-materials";
import { dailyWritingActivities } from "@/data/daily-writing";
import type { FilterGroup, Worksheet, WorksheetLibraryData } from "./worksheet-types";
import type { Locale } from "@/i18n/config";

const arabicWorksheets = new Set([
  "stage-1-worksheet-1",
  "stage-1-worksheet-2",
  "stage-1-worksheet-3",
]);

export function bundledWorksheetPath(id: string, locale: Locale) {
  if (id === "reading-overview") return `worksheets/bundled/letter-reading/${locale}/overview.pdf`;
  if (id.startsWith("reading-")) {
    const readingId = id.slice("reading-".length);
    const group = letterGroups.find(({ id }) => readingId.startsWith(`${id}-`));
    if (!group) return null;
    const itemId = readingId.slice(group.id.length + 1);
    if (itemId === "main" || itemId === "story") {
      const extension = itemId === "story" ? "pdf" : "webp";
      return `worksheets/bundled/letter-reading/${locale}/${readingId}.${extension}`;
    }
    if (groupMaterials[group.id].some((item) => item.id === itemId && item.kind !== "worksheet")) {
      return `worksheets/bundled/letter-reading/materials/${group.id}/${itemId}.webp`;
    }
    return null;
  }
  const activity = dailyWritingActivities.find((item) => id === `daily-writing-${item.id}`);
  if (activity) return `worksheets/bundled/daily-writing/${activity.id}.webp`;
  const groupId = letterGroups.find((group) => id.startsWith(`${group.id}-`))?.id;
  if (!groupId) return null;
  const materialId = id.slice(groupId.length + 1);
  if (!groupMaterials[groupId].some((item) => item.kind === "worksheet" && item.id === materialId)) return null;
  return locale === "ar" && groupId === "rain" && arabicWorksheets.has(materialId)
    ? `worksheets/bundled/${groupId}/ar/${materialId}.png`
    : `worksheets/bundled/${groupId}/${materialId}.webp`;
}

const group: FilterGroup = {
  id: "bundled-letter-group", key: "letter-group", label_he: "קבוצת אותיות", label_ar: "مجموعة الحروف",
  selection_mode: "single", sort_order: 0, is_visible: true,
  options: letterGroups.map(({ id, he, ar }, index) => ({
    id: `bundled-letter-group-${id}`, group_id: "bundled-letter-group", key: id,
    label_he: he, label_ar: ar, sort_order: index, is_visible: true,
  })),
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

export function withBundledWorksheets(data: WorksheetLibraryData, locale: Locale): WorksheetLibraryData {
  const letterGroupFilter = mergeFilterGroup(group, data.filterGroups.find(({ key }) => key === group.key));
  const stageFilter = mergeFilterGroup(stageGroup, data.filterGroups.find(({ key }) => key === stageGroup.key));
  const groupOptionIds = new Map(letterGroupFilter.options.map(({ key, id }) => [key, id]));
  const stageOptionIds = new Map(stageFilter.options.map(({ key, id }) => [key, id]));
  const worksheetOptionIds = { ...data.worksheetOptionIds };
  const sheets: Worksheet[] = [];
  for (const { id: groupId } of letterGroups) {
    if (locale === "ar" && groupId !== "rain") continue;
    for (const item of groupMaterials[groupId]) {
      if (item.kind !== "worksheet") continue;
      if (locale === "ar" && !arabicWorksheets.has(item.id)) continue;
      const id = `${groupId}-${item.id}`;
      const folder = `/letter-groups/${groupId}/${item.id}`;
      const date = groupId === "rain" ? "2026-11-24T00:00:00Z" : "2026-11-25T00:00:00Z";
      worksheetOptionIds[id] = [groupOptionIds.get(groupId)!, stageOptionIds.get(String(item.stage))!];
      sheets.push({
        id, title_he: item.he, title_ar: item.ar,
        description_he: null, description_ar: null,
        therapeutic_goal_he: null, therapeutic_goal_ar: null,
        letter_group_id: null,
        thumbnail_url: locale === "ar" ? `/letter-groups/rain/ar/${item.id}-preview.webp` : `${folder}-preview.webp`,
        file_url: null, has_file: true,
        file_type: "image", original_file_name: null, is_visible: true, sort_order: sheets.length,
        created_at: date, updated_at: date, bundled: true,
      });
    }
  }
  return {
    ...data,
    worksheets: [...sheets, ...data.worksheets],
    filterGroups: [letterGroupFilter, stageFilter, ...data.filterGroups.filter(({ key }) => key !== group.key && key !== stageGroup.key)],
    worksheetOptionIds,
  };
}
