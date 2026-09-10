import { unstable_cache } from "next/cache";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { LetterGroup, Worksheet, WorksheetLibraryData, WorksheetSkill, WorksheetTag } from "@/lib/worksheet-types";
export type { LetterGroup, Worksheet, WorksheetLibraryData, WorksheetSkill, WorksheetTag } from "@/lib/worksheet-types";

async function fetchLibrary(includeHidden: boolean): Promise<WorksheetLibraryData> {
  const supabase = includeHidden ? await createClient() : createPublicClient();
  let worksheetQuery = supabase.from("worksheets").select("id,title_he,title_ar,description_he,description_ar,therapeutic_goal_he,therapeutic_goal_ar,difficulty,skill_id,activity_type,age_group,letter_group_id,thumbnail_url,file_url,file_type,original_file_name,is_visible,sort_order,created_at,updated_at,worksheet_tags(worksheet_id,tag_id)").is("deleted_at", null).order("sort_order").order("created_at", { ascending: false });
  if (!includeHidden) worksheetQuery = worksheetQuery.eq("is_visible", true);
  const [worksheetResult, skillResult, tagResult, sectionResult] = await Promise.all([
    worksheetQuery,
    supabase.from("worksheet_skills").select("id,key,name_he,name_ar,sort_order").order("sort_order"),
    supabase.from("tags").select("id,slug,name_he,name_ar").order("name_he"),
    supabase.from("site_sections").select("id,key,settings,site_items(id,title_he,title_ar,sort_order)").or("page_key.eq.letters,key.eq.worksheets.content"),
  ]);
  const worksheets = (worksheetResult.data || []) as Array<Worksheet & { worksheet_tags?: { worksheet_id: string; tag_id: string }[] }>;
  const worksheetTags: Record<string, string[]> = {};
  for (const worksheet of worksheets) for (const link of worksheet.worksheet_tags || []) (worksheetTags[link.worksheet_id] ||= []).push(link.tag_id);
  const sections = (sectionResult.data || []) as Array<{ id: string; key: string; settings: { columns?: number } | null; site_items?: Array<LetterGroup & { sort_order: number }> }>;
  const worksheetSection = sections.find((section) => section.key === "worksheets.content");
  const letterGroups = sections.filter((section) => section.key !== "worksheets.content").flatMap((section) => section.site_items || []).sort((a, b) => a.sort_order - b.sort_order);
  const columns = Math.min(4, Math.max(1, Number(worksheetSection?.settings?.columns) || 3));
  return { worksheets, skills: (skillResult.data || []) as WorksheetSkill[], tags: (tagResult.data || []) as WorksheetTag[], worksheetTags, letterGroups, columns };
}

const cachedLibrary = unstable_cache(() => fetchLibrary(false), ["worksheet-library"], { revalidate: 300, tags: ["worksheets"] });
export async function getWorksheetLibrary(isAdmin = false) { return isAdmin ? fetchLibrary(true) : cachedLibrary(); }
