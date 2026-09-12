import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const safeDestination = (requestedNext: string | null) =>
  requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\")
    ? requestedNext
    : "/he";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const safeNext = safeDestination(searchParams.get("next"));
  const locale = safeNext.startsWith("/ar") ? "ar" : "he";
  const loginFailure = () =>
    NextResponse.redirect(new URL(`/${locale}/login?error=oauth_failed`, origin));
  const code = searchParams.get("code");

  if (!code || searchParams.has("error")) return loginFailure();

  const store = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (items) => items.forEach(({ name, value, options }) => store.set(name, value, options)),
      },
    },
  );
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return loginFailure();

  return NextResponse.redirect(new URL(safeNext, origin));
}
