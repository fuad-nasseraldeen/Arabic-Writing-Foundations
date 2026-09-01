import { unstable_cache } from "next/cache";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { LetterGroup, Worksheet, WorksheetLibraryData, WorksheetSkill, WorksheetTag } from "@/lib/worksheet-types";
export type { LetterGroup, Worksheet, WorksheetLibraryData, WorksheetSkill, WorksheetTag } from "@/lib/worksheet-types";

async function fetchLibrary(includeHidden: boolean): Promise<WorksheetLibraryData> {
  const supabase = includeHidden ? await createClient() : createPublicClient();
  const [{ data: letterSections }, { data: worksheetSection }] = await Promise.all([supabase.from("site_sections").select("id").eq("page_key", "letters"), supabase.from("site_sections").select("settings").eq("key", "worksheets.content").maybeSingle()]);
  let worksheetQuery = supabase.from("worksheets").select("id,title_he,title_ar,description_he,description_ar,therapeutic_goal_he,therapeutic_goal_ar,difficulty,skill_id,activity_type,age_group,letter_group_id,thumbnail_url,file_url,file_type,original_file_name,is_visible,sort_order,created_at,updated_at").is("deleted_at", null).order("sort_order").order("created_at", { ascending: false });
  if (!includeHidden) worksheetQuery = worksheetQuery.eq("is_visible", true);
  const [worksheetResult, skillResult, tagResult, letterResult] = await Promise.all([
    worksheetQuery,
    supabase.from("worksheet_skills").select("id,key,name_he,name_ar,sort_order").order("sort_order"),
    supabase.from("tags").select("id,slug,name_he,name_ar").order("name_he"),
    letterSections?.length ? supabase.from("site_items").select("id,title_he,title_ar").in("section_id", letterSections.map((section) => section.id)).is("deleted_at", null).order("sort_order") : Promise.resolve({ data: [] }),
  ]);
  const worksheets = (worksheetResult.data || []) as Worksheet[];
  const ids = worksheets.map((worksheet) => worksheet.id);
  const tagLinks = ids.length ? await supabase.from("worksheet_tags").select("worksheet_id,tag_id").in("worksheet_id", ids) : { data: [] as { worksheet_id: string; tag_id: string }[] };
  const worksheetTags: Record<string, string[]> = {};
  for (const link of tagLinks.data || []) (worksheetTags[link.worksheet_id] ||= []).push(link.tag_id);
  const columns = Math.min(4, Math.max(1, Number((worksheetSection?.settings as { columns?: number } | null)?.columns) || 3));
  return { worksheets, skills: (skillResult.data || []) as WorksheetSkill[], tags: (tagResult.data || []) as WorksheetTag[], worksheetTags, letterGroups: (letterResult.data || []) as LetterGroup[], columns };
}

const cachedLibrary = unstable_cache(() => fetchLibrary(false), ["worksheet-library"], { revalidate: 300, tags: ["worksheets"] });
export async function getWorksheetLibrary(isAdmin = false) { return isAdmin ? fetchLibrary(true) : cachedLibrary(); }
