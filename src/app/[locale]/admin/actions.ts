"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
const slugify = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const value = (fd: FormData, key: string) => String(fd.get(key) || "").trim();
export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}
export async function saveCategory(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const data = {
    name_he: value(formData, "name_he"),
    name_ar: value(formData, "name_ar") || null,
    description_he: value(formData, "description_he") || null,
    description_ar: value(formData, "description_ar") || null,
    slug: slugify(value(formData, "slug") || value(formData, "name_he")),
    sort_order: Number(value(formData, "sort_order") || 0),
    is_visible: formData.get("is_visible") === "on",
    updated_by: user.id,
  };
  if (!data.name_he || !data.slug)
    throw new Error("Category name and slug are required");
  const result = id
    ? await supabase.from("categories").update(data).eq("id", id)
    : await supabase
        .from("categories")
        .insert({ ...data, created_by: user.id });
  if (result.error) throw new Error(result.error.message);
  revalidatePath(`/${locale}/admin/categories`);
}
export async function deleteCategory(locale: string, formData: FormData) {
  await requireAdmin(locale);
  const id = value(formData, "id");
  const supabase = await createClient();
  const { count } = await supabase
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (count)
    throw new Error(
      "Move or delete associated content before deleting this category.",
    );
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/${locale}/admin/categories`);
}
export async function saveContent(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const status =
    value(formData, "status") === "published" ? "published" : "draft";
  const data = {
    category_id: value(formData, "category_id") || null,
    title_he: value(formData, "title_he"),
    title_ar: value(formData, "title_ar") || null,
    excerpt_he: value(formData, "excerpt_he") || null,
    excerpt_ar: value(formData, "excerpt_ar") || null,
    body_he: value(formData, "body_he") || null,
    body_ar: value(formData, "body_ar") || null,
    cover_image_url: value(formData, "cover_image_url") || null,
    slug: slugify(value(formData, "slug") || value(formData, "title_he")),
    status,
    sort_order: Number(value(formData, "sort_order") || 0),
    published_at: status === "published" ? new Date().toISOString() : null,
    updated_by: user.id,
  };
  if (!data.title_he || !data.slug)
    throw new Error("Hebrew title and slug are required");
  const result = id
    ? await supabase.from("content_items").update(data).eq("id", id)
    : await supabase
        .from("content_items")
        .insert({ ...data, created_by: user.id });
  if (result.error) throw new Error(result.error.message);
  revalidatePath(`/${locale}/admin/content`);
}
export async function deleteContent(locale: string, formData: FormData) {
  await requireAdmin(locale);
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .delete()
    .eq("id", value(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/${locale}/admin/content`);
}
export async function addAdmin(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const email = value(formData, "email").toLowerCase();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile)
    throw new Error(
      "This person must sign in once before receiving administrator access.",
    );
  const { error: insertError } = await supabase
    .from("admins")
    .insert({ user_id: profile.id, created_by: user.id });
  if (insertError)
    throw new Error(
      insertError.code === "23505"
        ? "This user is already an administrator."
        : insertError.message,
    );
  revalidatePath(`/${locale}/admin/admins`);
}
export async function removeAdmin(locale: string, formData: FormData) {
  await requireAdmin(locale);
  const id = value(formData, "id");
  const supabase = await createClient();
  const { count } = await supabase
    .from("admins")
    .select("user_id", { count: "exact", head: true });
  if ((count || 0) <= 1)
    throw new Error("The final administrator cannot be removed.");
  const { error } = await supabase.from("admins").delete().eq("user_id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/${locale}/admin/admins`);
}
export async function deleteMedia(locale: string, formData: FormData) {
  await requireAdmin(locale);
  const id = value(formData, "id"),
    path = value(formData, "path");
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("content_items")
    .select("id")
    .eq("cover_image_url", path);
  if (items?.length)
    throw new Error(
      "This file is used as a content cover. Change the reference before deletion.",
    );
  const { error } = await supabase.storage.from("site-media").remove([path]);
  if (error) throw new Error(error.message);
  await supabase.from("media").delete().eq("id", id);
  revalidatePath(`/${locale}/admin/media`);
}
async function audit(
  entity_type: string,
  entity_id: string,
  action: string,
  previous_data: unknown,
  new_data: unknown,
  userId: string,
) {
  const supabase = await createClient();
  await supabase
    .from("content_revisions")
    .insert({
      entity_type,
      entity_id,
      action,
      previous_data,
      new_data,
      changed_by: userId,
    });
}
export async function saveSection(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const { data: before } = await supabase
    .from("site_sections")
    .select("*")
    .eq("id", id)
    .single();
  const settings = {
    ...(before?.settings || {}),
    cta_href: value(formData, "cta_href") || before?.settings?.cta_href,
    cta_label_he: formData.has("cta_label_he")
      ? value(formData, "cta_label_he")
      : before?.settings?.cta_label_he,
    cta_label_ar: formData.has("cta_label_ar")
      ? value(formData, "cta_label_ar")
      : before?.settings?.cta_label_ar,
  };
  const data = {
    title_he: formData.has("title_he")
      ? value(formData, "title_he")
      : before?.title_he,
    title_ar: formData.has("title_ar")
      ? value(formData, "title_ar")
      : before?.title_ar,
    subtitle_he: formData.has("subtitle_he")
      ? value(formData, "subtitle_he")
      : before?.subtitle_he,
    subtitle_ar: formData.has("subtitle_ar")
      ? value(formData, "subtitle_ar")
      : before?.subtitle_ar,
    status: value(formData, "status") === "draft" ? "draft" : "published",
    is_visible: formData.get("is_visible") === "on",
    settings,
    updated_by: user.id,
  };
  const { error } = await supabase
    .from("site_sections")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  await audit(
    "site_section",
    id,
    data.status === "published" ? "publish" : "update",
    before,
    data,
    user.id,
  );
  revalidateTag(`cms:${before?.page_key || "home"}`, "max");
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/admin/pages`);
}
export async function moveSection(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const id = value(formData, "id"),
    direction = value(formData, "direction");
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("site_sections")
    .select("id,page_key,sort_order")
    .eq("id", id)
    .single();
  if (!current) return;
  const op = direction === "up" ? "lt" : "gt";
  const order = direction === "up" ? { ascending: false } : { ascending: true };
  const { data: other } = await supabase
    .from("site_sections")
    .select("id,sort_order")
    .eq("page_key", current.page_key)
    [op]("sort_order", current.sort_order)
    .order("sort_order", order)
    .limit(1)
    .maybeSingle();
  if (other) {
    await supabase
      .from("site_sections")
      .update({ sort_order: other.sort_order, updated_by: user.id })
      .eq("id", current.id);
    await supabase
      .from("site_sections")
      .update({ sort_order: current.sort_order, updated_by: user.id })
      .eq("id", other.id);
    await audit(
      "site_section",
      id,
      "update",
      current,
      { ...current, sort_order: other.sort_order },
      user.id,
    );
  }
  revalidatePath(`/${locale}`);
}
export async function saveTheme(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const theme_key = value(formData, "theme_key");
  if (
    !["original", "white", "soft-blue", "soft-lavender", "warm-beige"].includes(
      theme_key,
    )
  )
    throw new Error("Invalid theme preset.");
  const { error } = await supabase
    .from("theme_settings")
    .update({ name: theme_key, theme_key, updated_by: user.id })
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  revalidateTag("theme", "max");
  revalidatePath(`/${locale}/admin/design`);
}
async function refreshItemPage(locale: string, sectionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_sections")
    .select("page_key")
    .eq("id", sectionId)
    .single();
  const page = data?.page_key || "home";
  revalidateTag(`cms:${page}`, "max");
  revalidatePath(`/${locale}${page === "home" ? "" : `/${page}`}`);
}
export async function saveSectionColumns(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id"),
    columns = Number(value(formData, "columns"));
  if (![1, 2, 3, 4].includes(columns)) throw new Error("Invalid column count.");
  const { data: before, error: readError } = await supabase
    .from("site_sections")
    .select("page_key,settings")
    .eq("id", id)
    .single();
  if (readError || !before)
    throw new Error(readError?.message || "Section not found.");
  const { error } = await supabase
    .from("site_sections")
    .update({
      settings: { ...(before.settings || {}), columns },
      updated_by: user.id,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await audit(
    "site_section",
    id,
    "update",
    before,
    { ...before, settings: { ...(before.settings || {}), columns } },
    user.id,
  );
  revalidateTag(`cms:${before.page_key}`, "max");
  revalidatePath(
    `/${locale}${before.page_key === "home" ? "" : `/${before.page_key}`}`,
  );
}
export async function saveSiteItem(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id"),
    section_id = value(formData, "section_id"),
    hasButton = value(formData, "has_button") === "true",
    requestedParent = value(formData, "parent_id");
  const { data: before } = id
    ? await supabase.from("site_items").select("*").eq("id", id).single()
    : { data: null };
  const parent_id = requestedParent || before?.parent_id || null;
  if (id && parent_id === id)
    throw new Error("A card cannot be its own subgroup.");
  if (parent_id) {
    const { data: parent, error: parentError } = await supabase
      .from("site_items")
      .select("id,section_id,deleted_at")
      .eq("id", parent_id)
      .single();
    if (
      parentError ||
      !parent ||
      parent.deleted_at ||
      parent.section_id !== section_id
    )
      throw new Error("The selected parent group is unavailable.");
  }
  const behavior =
    value(formData, "click_behavior") || before?.click_behavior || null;
  if (behavior && !["content", "link", "media", "children"].includes(behavior))
    throw new Error("Invalid card behavior.");
  const childColumns = Number(
    value(formData, "child_columns") || before?.settings?.childColumns || 3,
  );
  if (![1, 2, 3, 4].includes(childColumns))
    throw new Error("Invalid child column count.");
  const imageUrl = value(formData, "image_url"),
    fileUrl = value(formData, "file_url");
  const data = {
    section_id,
    parent_id,
    item_type: value(formData, "item_type") || "feature_card",
    click_behavior: behavior,
    title_he: formData.has("title_he")
      ? value(formData, "title_he")
      : before?.title_he,
    title_ar: formData.has("title_ar")
      ? value(formData, "title_ar")
      : before?.title_ar,
    description_he: formData.has("description_he")
      ? value(formData, "description_he")
      : before?.description_he,
    description_ar: formData.has("description_ar")
      ? value(formData, "description_ar")
      : before?.description_ar,
    cta_label_he: hasButton
      ? formData.has("cta_label_he")
        ? value(formData, "cta_label_he")
        : before?.cta_label_he
      : null,
    cta_label_ar: hasButton
      ? formData.has("cta_label_ar")
        ? value(formData, "cta_label_ar")
        : before?.cta_label_ar
      : null,
    cta_href: hasButton
      ? value(formData, "cta_href") || before?.cta_href || null
      : null,
    image_url: imageUrl || null,
    file_url: fileUrl || null,
    media_title_he: formData.has("media_title_he")
      ? value(formData, "media_title_he") || null
      : before?.media_title_he,
    media_title_ar: formData.has("media_title_ar")
      ? value(formData, "media_title_ar") || null
      : before?.media_title_ar,
    media_size: ["small", "medium", "large"].includes(
      value(formData, "media_size"),
    )
      ? value(formData, "media_size")
      : before?.media_size || "medium",
    media_fit: ["cover", "contain"].includes(value(formData, "media_fit"))
      ? value(formData, "media_fit")
      : before?.media_fit || "cover",
    media_position: ["top", "bottom"].includes(
      value(formData, "media_position"),
    )
      ? value(formData, "media_position")
      : before?.media_position || "top",
    original_file_name: value(formData, "original_file_name") || null,
    media_mime_type: value(formData, "media_mime_type") || null,
    is_visible: formData.get("is_visible") === "on",
    settings: { ...(before?.settings || {}), childColumns },
    updated_by: user.id,
  };
  const maxQuery = supabase
    .from("site_items")
    .select("sort_order")
    .eq("section_id", section_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (parent_id) maxQuery.eq("parent_id", parent_id);
  else maxQuery.is("parent_id", null);
  const { data: maxItem } = id ? { data: null } : await maxQuery.maybeSingle();
  const result = id
    ? await supabase
        .from("site_items")
        .update(data)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("site_items")
        .insert({
          ...data,
          created_by: user.id,
          sort_order: (maxItem?.sort_order || 0) + 1,
        })
        .select("id")
        .single();
  if (result.error) throw new Error(result.error.message);
  await audit(
    "site_item",
    result.data.id,
    id ? "update" : "create",
    before,
    data,
    user.id,
  );
  await refreshItemPage(locale, section_id);
}
export async function deleteSiteItem(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const { data: before } = await supabase
    .from("site_items")
    .select("id,section_id,title_he,title_ar")
    .eq("id", id)
    .single();
  if (!before) throw new Error("Card not found.");
  const { count, error: childrenError } = await supabase
    .from("site_items")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id)
    .is("deleted_at", null);
  if (childrenError) throw new Error(childrenError.message);
  if (count)
    throw new Error(
      `This group contains ${count} subgroups. Delete them first.`,
    );
  const { error } = await supabase
    .from("site_items")
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await audit("site_item", id, "delete", before, null, user.id);
  await refreshItemPage(locale, before.section_id);
}
export async function saveVisualSiteItem(locale: string, formData: FormData) {
  const user = await requireAdmin(locale),
    supabase = await createClient(),
    id = value(formData, "id"),
    section_id = value(formData, "section_id");
  let blocks: unknown[] = [];
  try {
    const parsed = JSON.parse(value(formData, "content_blocks") || "[]");
    if (Array.isArray(parsed)) blocks = parsed.slice(0, 30);
  } catch {}
  const { data: before } = id
    ? await supabase.from("site_items").select("*").eq("id", id).single()
    : { data: null };
  const data = {
    section_id,
    parent_id: value(formData, "parent_id") || before?.parent_id || null,
    item_type: before?.item_type || "feature_card",
    click_behavior: ["content", "link", "media", "children"].includes(value(formData, "click_behavior"))
      ? value(formData, "click_behavior")
      : before?.click_behavior || "content",
    title_he: value(formData, "title_he"),
    title_ar: value(formData, "title_ar") || null,
    description_he: value(formData, "description_he") || null,
    description_ar: value(formData, "description_ar") || null,
    cta_label_he: value(formData, "cta_label_he") || null,
    cta_label_ar: value(formData, "cta_label_ar") || null,
    cta_href: value(formData, "cta_href") || null,
    show_button: formData.get("has_button") === "true",
    image_url: value(formData, "image_url") || null,
    file_url: value(formData, "file_url") || null,
    original_file_name: value(formData, "original_file_name") || null,
    media_mime_type: value(formData, "media_mime_type") || null,
    media_size: ["small", "medium", "large"].includes(
      value(formData, "media_size"),
    )
      ? value(formData, "media_size")
      : "medium",
    media_fit: ["cover", "contain"].includes(value(formData, "media_fit"))
      ? value(formData, "media_fit")
      : "cover",
    media_position: ["top", "bottom"].includes(value(formData, "media_position"))
      ? value(formData, "media_position")
      : before?.media_position || "top",
    is_visible: formData.get("is_visible") === "on",
    settings: { ...(before?.settings || {}), contentBlocks: blocks, childColumns: [1, 2, 3, 4].includes(Number(value(formData, "child_columns"))) ? Number(value(formData, "child_columns")) : before?.settings?.childColumns || 3 },
    updated_by: user.id,
  };
  if (!data.title_he) throw new Error("Hebrew title is required.");
  const result = id
    ? await supabase
        .from("site_items")
        .update(data)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("site_items")
        .insert({ ...data, created_by: user.id, sort_order: 0 })
        .select("id")
        .single();
  if (result.error) throw new Error(result.error.message);
  await audit(
    "site_item",
    result.data.id,
    id ? "update" : "create",
    before,
    data,
    user.id,
  );
  await refreshItemPage(locale, section_id);
}
export async function moveSiteItem(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id"),
    direction = value(formData, "direction");
  const { data: current } = await supabase
    .from("site_items")
    .select("id,section_id,sort_order")
    .eq("id", id)
    .single();
  if (!current) return;
  let query = supabase
    .from("site_items")
    .select("id,sort_order")
    .eq("section_id", current.section_id)
    .is("deleted_at", null);
  query =
    direction === "up"
      ? query
          .lt("sort_order", current.sort_order)
          .order("sort_order", { ascending: false })
      : query
          .gt("sort_order", current.sort_order)
          .order("sort_order", { ascending: true });
  const { data: other } = await query.limit(1).maybeSingle();
  if (other) {
    await Promise.all([
      supabase
        .from("site_items")
        .update({ sort_order: other.sort_order, updated_by: user.id })
        .eq("id", current.id),
      supabase
        .from("site_items")
        .update({ sort_order: current.sort_order, updated_by: user.id })
        .eq("id", other.id),
    ]);
    await audit(
      "site_item",
      id,
      "update",
      current,
      { ...current, sort_order: other.sort_order },
      user.id,
    );
  }
  await refreshItemPage(locale, current.section_id);
}
export async function saveWorksheet(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id"),
    difficulty = value(formData, "difficulty"),
    activity_type = value(formData, "activity_type"),
    age_group = value(formData, "age_group") || null,
    file_url = value(formData, "file_url") || null,
    thumbnail_url = value(formData, "thumbnail_url") || null;
  if (!["easy", "medium", "hard"].includes(difficulty))
    throw new Error("Invalid difficulty.");
  if (
    ![
      "tracing",
      "copying",
      "completion",
      "matching",
      "sorting",
      "independent-writing",
      "visual-discrimination",
      "multi-sensory",
      "other",
    ].includes(activity_type)
  )
    throw new Error("Invalid activity type.");
  if (age_group && !["4-5", "5-6", "6-7", "all"].includes(age_group))
    throw new Error("Invalid age group.");
  const { data: before } = id
    ? await supabase.from("worksheets").select("*").eq("id", id).single()
    : { data: null };
  const fileMime = value(formData, "file_url_mime"),
    data = {
      title_he: value(formData, "title_he"),
      title_ar: value(formData, "title_ar") || null,
      description_he: value(formData, "description_he") || null,
      description_ar: value(formData, "description_ar") || null,
      therapeutic_goal_he: value(formData, "therapeutic_goal_he") || null,
      therapeutic_goal_ar: value(formData, "therapeutic_goal_ar") || null,
      difficulty,
      skill_id: value(formData, "skill_id") || null,
      activity_type,
      age_group,
      letter_group_id: value(formData, "letter_group_id") || null,
      thumbnail_url,
      file_url,
      file_type: file_url
        ? fileMime === "application/pdf" ||
          file_url.toLowerCase().includes(".pdf")
          ? "pdf"
          : "image"
        : null,
      original_file_name: value(formData, "file_url_file_name") || null,
      is_visible: formData.get("is_visible") === "on",
      updated_by: user.id,
    };
  if (!data.title_he) throw new Error("Hebrew title is required.");
  if (!id && !file_url) throw new Error("A worksheet file is required.");
  const { data: max } = id
    ? { data: null }
    : await supabase
        .from("worksheets")
        .select("sort_order")
        .is("deleted_at", null)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
  const result = id
    ? await supabase
        .from("worksheets")
        .update(data)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("worksheets")
        .insert({
          ...data,
          created_by: user.id,
          sort_order: (max?.sort_order || 0) + 1,
        })
        .select("id")
        .single();
  if (result.error) throw new Error(result.error.message);
  const worksheetId = result.data.id;
  await supabase
    .from("worksheet_tags")
    .delete()
    .eq("worksheet_id", worksheetId);
  let tagIds = formData.getAll("tag_ids").map(String).filter(Boolean);
  const newName = value(formData, "new_tag_he");
  if (newName) {
    const slug = slugify(newName);
    const { data: tag, error } = await supabase
      .from("tags")
      .upsert(
        {
          slug,
          name_he: newName,
          name_ar: value(formData, "new_tag_ar") || null,
          created_by: user.id,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    tagIds.push(tag.id);
  }
  if (tagIds.length) {
    const { error } = await supabase
      .from("worksheet_tags")
      .insert(
        [...new Set(tagIds)].map((tag_id) => ({
          worksheet_id: worksheetId,
          tag_id,
        })),
      );
    if (error) throw new Error(error.message);
  }
  await audit(
    "worksheet",
    worksheetId,
    id ? "update" : "create",
    before,
    data,
    user.id,
  );
  revalidateTag("worksheets", "max");
  revalidatePath(`/${locale}/worksheets`);
}
export async function deleteWorksheet(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const { data: before, error: readError } = await supabase
    .from("worksheets")
    .select("*")
    .eq("id", id)
    .single();
  if (readError || !before)
    throw new Error(readError?.message || "Worksheet not found.");
  const { error } = await supabase
    .from("worksheets")
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (formData.get("delete_file") === "on" && before.file_url) {
    const { count } = await supabase
      .from("worksheets")
      .select("id", { count: "exact", head: true })
      .eq("file_url", before.file_url)
      .is("deleted_at", null);
    if ((count || 0) === 0) {
      const marker = "/storage/v1/object/public/site-media/";
      const index = before.file_url.indexOf(marker);
      if (index >= 0) {
        const path = decodeURIComponent(
          before.file_url.slice(index + marker.length),
        );
        await supabase.storage.from("site-media").remove([path]);
        await supabase.from("media").delete().eq("storage_path", path);
      }
    }
  }
  await audit("worksheet", id, "delete", before, null, user.id);
  revalidateTag("worksheets", "max");
  revalidatePath(`/${locale}/worksheets`);
}
