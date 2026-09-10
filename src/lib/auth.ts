import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * `getUser` is deliberately kept separate from the role lookup.  Most server
 * renders do not need a role at all; React memoizes this once per request for
 * the protected routes/actions that do.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getAuthContext = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return { user: null, isAdmin: false };
  const supabase = await createClient();
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  return { user, isAdmin: !error && isAdmin === true };
});

export async function isAdmin(){return (await getAuthContext()).isAdmin;}
export async function requireUser(locale="he"){const user=await getCurrentUser();if(!user)redirect(`/${locale}/login`);return user;}
export async function requireAdmin(locale="he"){const context=await getAuthContext();if(!context.user)redirect(`/${locale}/login`);if(!context.isAdmin)redirect(`/${locale}`);return context.user;}
