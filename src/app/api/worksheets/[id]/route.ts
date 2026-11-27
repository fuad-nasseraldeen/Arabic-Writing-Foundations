import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient as createStorageClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";
import { bundledWorksheetPath, groupPrintDocumentIds } from "@/lib/bundled-worksheets";
import { createClient } from "@/lib/supabase/server";
import { resolveWorksheetPath, worksheetBucket } from "@/lib/worksheet-storage";

const headers = { "Cache-Control": "private, no-store" };
const expiresIn = 60;

function canAccessWorksheet(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return Boolean(user && !user.is_anonymous);
}

function worksheetStorage(url: string, key: string) {
  return createStorageClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from(worksheetBucket);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!canAccessWorksheet(user)) return Response.json({ error: "login_required" }, { status: 401, headers });

  const { id } = await params;
  const locale = new URL(request.url).searchParams.get("locale") === "ar" ? "ar" : "he";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (id.startsWith("print-group-")) {
    const ids = groupPrintDocumentIds(id.slice("print-group-".length));
    if (!ids) return Response.json({ error: "unavailable" }, { status: 404, headers });
    const paths = ids.map((documentId) => bundledWorksheetPath(documentId, locale));
    if (!paths.every((path) => path !== null)) {
      return Response.json({ error: "unavailable" }, { status: 503, headers });
    }
    if (process.env.NODE_ENV === "development" && !storageKey) {
      const documents = ids.map((documentId, index) => ({
        url: `/api/worksheets/${documentId}?locale=${locale}`,
        pdf: paths[index].endsWith(".pdf"),
      }));
      return Response.json({ documents }, { headers });
    }
    if (!storageKey) return Response.json({ error: "unavailable" }, { status: 503, headers });
    const { data, error } = await worksheetStorage(supabaseUrl, storageKey).createSignedUrls(paths, expiresIn);
    const urls = new Map(data?.map(({ path, signedUrl }) => [path, signedUrl]));
    const documents = paths.map((path) => ({ url: urls.get(path), pdf: path.endsWith(".pdf") }));
    if (error || documents.some(({ url }) => !url)) {
      return Response.json({ error: "unavailable" }, { status: 503, headers });
    }
    return Response.json({ documents }, { headers });
  }
  let path = bundledWorksheetPath(id, locale);
  let pdf = false;
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
  const { data, error } = await worksheetStorage(supabaseUrl, storageKey).createSignedUrl(path, expiresIn);
  if (error || !data) return Response.json({ error: "unavailable" }, { status: 503, headers });
  return Response.json({ url: data.signedUrl, pdf: pdf || path.endsWith(".pdf") }, { headers });
}
