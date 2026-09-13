"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isFontPresetKey } from "@/components/cms/fontPresets";
import { isAccentPresetKey } from "@/components/cms/themePresets";
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
const weeklyTipIcons = ["lightbulb", "leaf", "brain", "star", "pencil", "book"];
async function refreshWeeklyTips(locale: string) {
  revalidateTag("weekly-tips", "max");
  revalidatePath(`/${locale}/weekly-tip`);
  revalidatePath("/weekly-tip");
  revalidatePath(`/${locale}/admin/tips`);
}
export async function saveWeeklyTip(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const icon_key = value(formData, "icon_key") || "lightbulb";
  if (!weeklyTipIcons.includes(icon_key))
    throw new Error("Invalid weekly tip icon.");
  const data = {
    title_he: value(formData, "title_he"),
    title_ar: value(formData, "title_ar") || null,
    description_he: value(formData, "description_he"),
    description_ar: value(formData, "description_ar") || null,
    category: value(formData, "category") || null,
    icon_key,
    is_active: formData.get("is_active") === "on",
    updated_by: user.id,
  };
  if (!data.title_he || !data.description_he)
    throw new Error("Weekly tip title and description are required.");
  if (id) {
    const { data: before } = await supabase
      .from("weekly_tips")
      .select("*")
      .eq("id", id)
      .single();
    const { error } = await supabase
      .from("weekly_tips")
      .update(data)
      .eq("id", id);
    if (error) throw new Error(error.message);
    await audit("weekly_tip", id, "update", before, data, user.id);
  } else {
    const { data: last } = await supabase
      .from("weekly_tips")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: created, error } = await supabase
      .from("weekly_tips")
      .insert({
        ...data,
        sort_order: (last?.sort_order || 0) + 1,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await audit("weekly_tip", created.id, "create", null, data, user.id);
  }
  await refreshWeeklyTips(locale);
}
export async function deleteWeeklyTip(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const { data: before } = await supabase
    .from("weekly_tips")
    .select("*")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("weekly_tips").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (before) await audit("weekly_tip", id, "delete", before, null, user.id);
  await refreshWeeklyTips(locale);
}
export async function toggleWeeklyTipActive(
  locale: string,
  formData: FormData,
) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const { data: before, error: readError } = await supabase
    .from("weekly_tips")
    .select("*")
    .eq("id", id)
    .single();
  if (readError || !before)
    throw new Error(readError?.message || "Weekly tip not found.");
  const { error } = await supabase
    .from("weekly_tips")
    .update({ is_active: !before.is_active, updated_by: user.id })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await audit(
    "weekly_tip",
    id,
    before.is_active ? "hide" : "update",
    before,
    { ...before, is_active: !before.is_active },
    user.id,
  );
  await refreshWeeklyTips(locale);
}
export async function moveWeeklyTip(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id"),
    direction = value(formData, "direction");
  const { data: current } = await supabase
    .from("weekly_tips")
    .select("id,sort_order")
    .eq("id", id)
    .single();
  if (!current) return;
  const op = direction === "up" ? "lt" : "gt";
  const order = direction === "up" ? { ascending: false } : { ascending: true };
  const { data: other } = await supabase
    .from("weekly_tips")
    .select("id,sort_order")
    [op]("sort_order", current.sort_order)
    .order("sort_order", order)
    .limit(1)
    .maybeSingle();
  if (other) {
    const first = await supabase
      .from("weekly_tips")
      .update({ sort_order: other.sort_order, updated_by: user.id })
      .eq("id", current.id);
    const second = await supabase
      .from("weekly_tips")
      .update({ sort_order: current.sort_order, updated_by: user.id })
      .eq("id", other.id);
    if (first.error || second.error)
      throw new Error(first.error?.message || second.error?.message);
    await audit(
      "weekly_tip",
      id,
      "update",
      current,
      { ...current, sort_order: other.sort_order },
      user.id,
    );
  }
  await refreshWeeklyTips(locale);
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
  await supabase.from("content_revisions").insert({
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
  const page = before?.page_key || "home";
  revalidateTag(`cms:${page}`, "max");
  revalidatePath(`/${locale}${page === "home" ? "" : `/${page}`}`);
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
  revalidateTag(`cms:${current.page_key}`, "max");
  revalidatePath(`/${locale}${current.page_key === "home" ? "" : `/${current.page_key}`}`);
}
export async function saveTheme(locale: string, formData: FormData) {
  const user = await requireAdmin(locale);
  const supabase = await createClient();
  const theme_key = value(formData, "theme_key");
  const textScale = value(formData, "text_scale") || "normal";
  const fontPreset = value(formData, "font_preset") || "heebo";
  const accentPreset = value(formData, "accent_preset") || "teal";
  if (
    !["original", "white", "soft-blue", "soft-lavender", "warm-beige"].includes(
      theme_key,
    )
  )
    throw new Error("Invalid theme preset.");
  if (!['compact', 'normal', 'large'].includes(textScale))
    throw new Error("Invalid text scale.");
  if (!isFontPresetKey(fontPreset)) throw new Error("Invalid font preset.");
  if (!isAccentPresetKey(accentPreset)) throw new Error("Invalid accent preset.");
  const { data: current, error: readError } = await supabase
    .from("theme_settings")
    .select("tokens")
    .eq("is_active", true)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  const tokens = current?.tokens && typeof current.tokens === "object" && !Array.isArray(current.tokens)
    ? current.tokens as Record<string, unknown>
    : {};
  const { error } = await supabase
    .from("theme_settings")
    .update({ name: theme_key, theme_key, tokens: { ...tokens, textScale, fontPreset, accentPreset }, updated_by: user.id })
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
  const { data: activeItems, error: childrenError } = await supabase
    .from("site_items")
    .select("id,parent_id")
    .eq("section_id", before.section_id)
    .is("deleted_at", null);
  if (childrenError) throw new Error(childrenError.message);
  const descendants: string[] = [];
  const pending = [id];
  while (pending.length) {
    const parentId = pending.pop();
    const children = (activeItems || []).filter((entry) => entry.parent_id === parentId);
    for (const child of children) {
      descendants.push(child.id);
      pending.push(child.id);
    }
  }
  if (descendants.length && formData.get("cascade") !== "true")
    throw new Error(
      `This group contains ${descendants.length} subgroups. Confirm cascade deletion first.`,
    );
  const ids = [id, ...descendants];
  const { error } = await supabase
    .from("site_items")
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .in("id", ids);
  if (error) throw new Error(error.message);
  await audit(
    "site_item",
    id,
    "delete",
    before,
    { deletedIds: ids, cascade: descendants.length > 0 },
    user.id,
  );
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
  let titleStyle: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(value(formData, "title_style") || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      titleStyle = parsed;
  } catch {}
  if (!["start", "center", "end"].includes(String(titleStyle.align)))
    delete titleStyle.align;
  if (!["small", "normal", "large", "heading"].includes(String(titleStyle.size)))
    delete titleStyle.size;
  if (!['none', 'tight', 'normal', 'loose'].includes(String(titleStyle.spacing)))
    delete titleStyle.spacing;
  if (typeof titleStyle.bold !== "boolean") delete titleStyle.bold;
  if (typeof titleStyle.underline !== "boolean") delete titleStyle.underline;
  let cardStyle: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(value(formData, "card_style") || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      cardStyle = parsed;
  } catch {}
  if (!["start", "center", "end"].includes(String(cardStyle.align)))
    delete cardStyle.align;
  if (!["default", "soft", "accent"].includes(String(cardStyle.background)))
    delete cardStyle.background;
  if (!["default", "soft", "none"].includes(String(cardStyle.border)))
    delete cardStyle.border;
  if (!["compact", "normal", "relaxed"].includes(String(cardStyle.density)))
    delete cardStyle.density;
  if (typeof cardStyle.showItemCount !== "boolean") delete cardStyle.showItemCount;
  const { data: before } = id
    ? await supabase.from("site_items").select("*").eq("id", id).single()
    : { data: null };
  const requestedItemType = value(formData, "item_type");
  // A group is stored as a regular card plus click_behavior=children. This
  // keeps old editor submissions safe against the database item-type check.
  const itemType = requestedItemType === "group" ? "feature_card" : requestedItemType;
  if (itemType !== "feature_card")
    throw new Error("Invalid card type.");
  const validBlock = (block: unknown) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) return false;
    const record = block as Record<string, unknown>;
    if (typeof record.id !== "string") return false;
    if (["paragraph", "subheading", "source"].includes(String(record.type)))
      return typeof record.he === "string" && typeof record.ar === "string";
    if (record.type === "button")
      return typeof record.he === "string" && typeof record.ar === "string" && typeof record.href === "string";
    const media = record.media;
    return (record.type === "image" || record.type === "pdf") && Boolean(media) && typeof media === "object" && !Array.isArray(media) && typeof (media as Record<string, unknown>).url === "string";
  };
  if (!blocks.every(validBlock)) throw new Error("Invalid content block.");
  const data = {
    section_id,
    parent_id: value(formData, "parent_id") || before?.parent_id || null,
    item_type: itemType,
    click_behavior:
      value(formData, "click_behavior") === "children" ? "children" : "content",
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
    media_position: ["top", "bottom"].includes(
      value(formData, "media_position"),
    )
      ? value(formData, "media_position")
      : before?.media_position || "top",
    is_visible: formData.has("is_visible")
      ? formData.get("is_visible") === "on"
      : before?.is_visible ?? true,
    settings: {
      ...(before?.settings || {}),
      contentBlocks: blocks,
      // These subtrees are fully editor-owned; keeping removed keys would make
      // old presentation options survive a user reset.
      titleStyle,
      cardStyle,
      childColumns: [1, 2, 3, 4].includes(
        Number(value(formData, "child_columns")),
      )
        ? Number(value(formData, "child_columns"))
        : before?.settings?.childColumns || 3,
    },
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
  const id = value(formData, "id");
  const file_url = value(formData, "file_url") || null;
  const thumbnail_url = value(formData, "thumbnail_url") || null;
  const optionIds = [...formData.entries()]
    .filter(([name]) => name === "filter_option_ids" || name.startsWith("filter_option_ids:"))
    .map(([, optionId]) => String(optionId))
    .filter(Boolean);
  const uniqueOptionIds = [...new Set(optionIds)];
  if (uniqueOptionIds.length) {
    const { data: options, error } = await supabase
      .from("filter_options")
      .select("id,group_id")
      .in("id", uniqueOptionIds);
    if (error || options?.length !== uniqueOptionIds.length)
      throw new Error(error?.message || "Invalid filter option.");
    const groupIds = [...new Set(options.map((option) => option.group_id))];
    const { data: groups, error: groupError } = await supabase
      .from("filter_groups")
      .select("id,selection_mode")
      .in("id", groupIds);
    if (groupError) throw new Error(groupError.message);
    const modes = new Map(groups?.map((group) => [group.id, group.selection_mode]));
    for (const groupId of groupIds) {
      if (!modes.has(groupId)) throw new Error("Invalid filter group.");
      if (modes.get(groupId) === "single" && options.filter((option) => option.group_id === groupId).length > 1)
        throw new Error("Only one option may be selected for this filter group.");
    }
  }
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
  const { error: removeAssignmentsError } = await supabase
    .from("worksheet_filter_options")
    .delete()
    .eq("worksheet_id", worksheetId);
  if (removeAssignmentsError) throw new Error(removeAssignmentsError.message);
  if (uniqueOptionIds.length) {
    const { error } = await supabase.from("worksheet_filter_options").insert(
      uniqueOptionIds.map((option_id) => ({ worksheet_id: worksheetId, option_id })),
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

const filterKey = (raw: string) => slugify(raw).replace(/_/g, "-");

export async function saveFilterGroup(locale: string, formData: FormData) {
  await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const key = filterKey(value(formData, "key"));
  const selection_mode = value(formData, "selection_mode");
  if (!key || !/^[a-z0-9-]+$/.test(key)) throw new Error("A valid filter key is required.");
  if (selection_mode !== "single" && selection_mode !== "multi") throw new Error("Invalid selection mode.");
  const data = {
    key,
    label_he: value(formData, "label_he"),
    label_ar: value(formData, "label_ar"),
    selection_mode,
    sort_order: Number(value(formData, "sort_order") || 0),
    is_visible: formData.get("is_visible") === "on",
  };
  if (!data.label_he || !data.label_ar) throw new Error("Both filter labels are required.");
  if (id && selection_mode === "single") {
    const { data: options, error: optionsError } = await supabase
      .from("filter_options")
      .select("id")
      .eq("group_id", id);
    if (optionsError) throw new Error(optionsError.message);
    const optionIds = options.map((option) => option.id);
    if (optionIds.length) {
      const { data: assignments, error: assignmentError } = await supabase
        .from("worksheet_filter_options")
        .select("worksheet_id")
        .in("option_id", optionIds);
      if (assignmentError) throw new Error(assignmentError.message);
      const counts = new Map<string, number>();
      for (const assignment of assignments) counts.set(assignment.worksheet_id, (counts.get(assignment.worksheet_id) || 0) + 1);
      if ([...counts.values()].some((count) => count > 1))
        throw new Error("This group has worksheets with multiple selected options.");
    }
  }
  const result = id
    ? await supabase.from("filter_groups").update(data).eq("id", id)
    : await supabase.from("filter_groups").insert(data);
  if (result.error) throw new Error(result.error.message);
  revalidateTag("worksheets", "max");
  revalidatePath(`/${locale}/worksheets`);
  revalidatePath(`/${locale}/admin/filters`);
}

export async function saveFilterOption(locale: string, formData: FormData) {
  await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const group_id = value(formData, "group_id");
  const key = filterKey(value(formData, "key"));
  if (!group_id || !key || !/^[a-z0-9-]+$/.test(key)) throw new Error("A group and valid option key are required.");
  const data = {
    group_id,
    key,
    label_he: value(formData, "label_he"),
    label_ar: value(formData, "label_ar"),
    sort_order: Number(value(formData, "sort_order") || 0),
    is_visible: formData.get("is_visible") === "on",
  };
  if (!data.label_he || !data.label_ar) throw new Error("Both option labels are required.");
  const result = id
    ? await supabase.from("filter_options").update(data).eq("id", id)
    : await supabase.from("filter_options").insert(data);
  if (result.error) throw new Error(result.error.message);
  revalidateTag("worksheets", "max");
  revalidatePath(`/${locale}/worksheets`);
  revalidatePath(`/${locale}/admin/filters`);
}

export async function deleteFilterOption(locale: string, formData: FormData) {
  await requireAdmin(locale);
  const supabase = await createClient();
  const id = value(formData, "id");
  const { count, error: countError } = await supabase
    .from("worksheet_filter_options")
    .select("option_id", { count: "exact", head: true })
    .eq("option_id", id);
  if (countError) throw new Error(countError.message);
  if ((count || 0) > 0) throw new Error("This option is in use. Hide it instead.");
  const { error } = await supabase.from("filter_options").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTag("worksheets", "max");
  revalidatePath(`/${locale}/worksheets`);
  revalidatePath(`/${locale}/admin/filters`);
}
