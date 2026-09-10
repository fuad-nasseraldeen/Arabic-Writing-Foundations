import { cookies } from "next/headers";

/**
 * This is only a request for draft data, never proof of authority. Callers
 * must combine it with `isAdmin()` before selecting admin-visible rows.
 */
export async function isCmsEditMode() {
  return (await cookies()).get("cms-edit-mode")?.value === "on";
}
