import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll() { return cookieStore.getAll(); }, setAll(items) { try { items.forEach(({name,value,options}) => cookieStore.set(name,value,options)); } catch {} } } });
}
/** Cookie-free client for cacheable, RLS-public reads only. */
export function createPublicClient(){return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});}
