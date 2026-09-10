"use server";

import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";

const cookieName = "cms-edit-mode";

/** The cookie requests a draft view only; every draft read still verifies admin. */
export async function setCmsEditMode(locale: string, enabled: boolean) {
  if (enabled) await requireAdmin(locale);
  const store = await cookies();
  if (enabled) {
    store.set(cookieName, "on", { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  } else {
    store.delete(cookieName);
  }
}
