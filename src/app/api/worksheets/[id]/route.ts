import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient as createStorageClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";
import { bundledWorksheetPath } from "@/lib/bundled-worksheets";
import { createClient } from "@/lib/supabase/server";
import { resolveWorksheetPath, worksheetBucket } from "@/lib/worksheet-storage";

const headers = { "Cache-Control": "private, no-store" };
const expiresIn = 60;

function canAccessWorksheet(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return Boolean(user && !user.is_anonymous);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!canAccessWorksheet(user)) return Response.json({ error: "login_required" }, { status: 401, headers });

  const { id } = await params;
  const locale = new URL(request.url).searchParams.get("locale") === "ar" ? "ar" : "he";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  let path = bundledWorksheetPath(id, locale);
  let pdf = false;
  const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (process.env.NODE_ENV === "development" && !storageKey && path) {
    try {
      const original = path.slice("worksheets/bundled/".length);
      const bytes = await readFile(join(process.cwd(), "worksheet-import", original));
      const contentType = original.endsWith(".pdf") ? "application/pdf"
        : original.endsWith(".png") ? "image/png" : "image/webp";
      return new Response(new Uint8Array(bytes), {
        headers: { ...headers, "Content-Type": contentType, "X-Content-Type-Options": "nosniff" },
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  if (!path && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("worksheets")
      .select("file_url,file_type").eq("id", id).is("deleted_at", null).maybeSingle();
    if (error) return Response.json({ error: "unavailable" }, { status: 503, headers });
    if (data?.file_url) {
      path = resolveWorksheetPath(data.file_url, supabaseUrl);
      pdf = data.file_type === "pdf" || Boolean(path?.toLowerCase().endsWith(".pdf"));
    }
  }
  if (!path) return Response.json({ error: "unavailable" }, { status: 404, headers });

  if (!storageKey) return Response.json({ error: "unavailable" }, { status: 503, headers });
  const storage = createStorageClient(supabaseUrl, storageKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage;
  const { data, error } = await storage.from(worksheetBucket).createSignedUrl(path, expiresIn);
  if (error || !data) return Response.json({ error: "unavailable" }, { status: 503, headers });
  return Response.json({ url: data.signedUrl, pdf: pdf || path.endsWith(".pdf") }, { headers });
}
