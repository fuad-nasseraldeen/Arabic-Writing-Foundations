import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

/** Auth UI is intentionally loaded after the public shell, not in its RSC path. */
export async function GET() {
  const { user, isAdmin } = await getAuthContext();
  return NextResponse.json(
    {
      user: user
        ? {
            email: user.email,
            full_name: user.user_metadata.full_name || user.user_metadata.name,
            avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture,
          }
        : null,
      isAdmin,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
