import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies:{ getAll:()=>request.cookies.getAll(), setAll(items) { items.forEach(({name,value,options})=>request.cookies.set(name,value)); response = NextResponse.next({request}); items.forEach(({name,value,options})=>response.cookies.set(name,value,options)); } } });
  // This keeps Supabase's SSR cookie-refresh contract, without doing an Auth
  // user lookup for every public RSC/prefetch request. getClaims validates the
  // JWT locally when JWKS is available and refreshes an expired session.
  await supabase.auth.getClaims(); return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"] };
