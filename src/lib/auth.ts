import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function getCurrentUser() { const supabase = await createClient(); const { data:{ user } } = await supabase.auth.getUser(); return user; }
export async function isAdmin() { const user = await getCurrentUser(); if (!user) return false; const supabase = await createClient(); const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle(); return !!data; }
export async function requireUser(locale = "he") { const user = await getCurrentUser(); if (!user) redirect(`/${locale}/login`); return user; }
export async function requireAdmin(locale = "he") { const user = await requireUser(locale); if (!(await isAdmin())) redirect(`/${locale}`); return user; }
