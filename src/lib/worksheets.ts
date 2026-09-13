import { unstable_cache } from "next/cache";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { FilterGroup, FilterOption, LetterGroup, Worksheet, WorksheetLibraryData } from "@/lib/worksheet-types";
export type { FilterGroup, FilterOption, LetterGroup, Worksheet, WorksheetLibraryData } from "@/lib/worksheet-types";

async function fetchLibrary(includeHidden: boolean): Promise<WorksheetLibraryData> {
  const supabase = includeHidden ? await createClient() : createPublicClient();
  let worksheets = supabase.from("worksheets").select("id,title_he,title_ar,description_he,description_ar,therapeutic_goal_he,therapeutic_goal_ar,letter_group_id,thumbnail_url,file_url,file_type,original_file_name,is_visible,sort_order,created_at,updated_at,worksheet_filter_options(worksheet_id,option_id)").is("deleted_at", null).order("sort_order").order("created_at", { ascending: false });
  if (!includeHidden) worksheets = worksheets.eq("is_visible", true);
  let groups = supabase.from("filter_groups").select("id,key,label_he,label_ar,selection_mode,sort_order,is_visible,filter_options(id,group_id,key,label_he,label_ar,sort_order,is_visible)").order("sort_order");
  if (!includeHidden) groups = groups.eq("is_visible", true);
  const [worksheetResult, groupResult, sectionResult] = await Promise.all([
    worksheets,
    groups,
    supabase.from("site_sections").select("id,key,settings,site_items(id,title_he,title_ar,sort_order)").or("page_key.eq.letters,key.eq.worksheets.content"),
  ]);
  if (worksheetResult.error) throw new Error(worksheetResult.error.message);
  if (groupResult.error) throw new Error(groupResult.error.message);
  const worksheetRows = (worksheetResult.data || []) as Array<Worksheet & { worksheet_filter_options?: { worksheet_id: string; option_id: string }[] }>;
  const worksheetOptionIds: Record<string, string[]> = {};
  for (const worksheet of worksheetRows) for (const link of worksheet.worksheet_filter_options || []) (worksheetOptionIds[link.worksheet_id] ||= []).push(link.option_id);
  const filterGroups = ((groupResult.data || []) as Array<Omit<FilterGroup, "options"> & { filter_options?: FilterOption[] }>).map((group) => ({ ...group, options: (group.filter_options || []).filter((option) => includeHidden || option.is_visible).sort((a, b) => a.sort_order - b.sort_order) }));
  const sections = (sectionResult.data || []) as Array<{ id: string; key: string; settings: { columns?: number } | null; site_items?: Array<LetterGroup & { sort_order: number }> }>;
  const worksheetSection = sections.find((section) => section.key === "worksheets.content");
  const letterGroups = sections.filter((section) => section.key !== "worksheets.content").flatMap((section) => section.site_items || []).sort((a, b) => a.sort_order - b.sort_order);
  return { worksheets: worksheetRows, filterGroups, worksheetOptionIds, letterGroups, columns: Math.min(4, Math.max(1, Number(worksheetSection?.settings?.columns) || 3)) };
}

const cachedLibrary = unstable_cache(() => fetchLibrary(false), ["worksheet-library"], { revalidate: 300, tags: ["worksheets"] });
export async function getWorksheetLibrary(isAdmin = false) { return isAdmin ? fetchLibrary(true) : cachedLibrary(); }
