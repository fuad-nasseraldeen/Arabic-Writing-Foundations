import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve("worksheet-import");
const files = (await readdir(root, { recursive: true, withFileTypes: true }))
  .filter((file) => file.isFile() && /^stage-\d-worksheet-\d+\.(webp|png)$/.test(file.name));
if (!files.length) throw new Error("No worksheet originals found in worksheet-import/.");
if (!process.argv.includes("--apply")) {
  console.log(`Found ${files.length} worksheet originals in worksheet-import/. Pass --apply to upload.`);
} else {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Set the Supabase URL and server-only service-role key.");
  }
  const { storage } = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const bucketName = "worksheet-files";
  const { data: bucket, error } = await storage.getBucket(bucketName);
  if (error || bucket?.public !== false) throw new Error("Expected a private worksheet-files bucket.");
  let uploaded = 0;
  for (const file of files) {
    const filename = join(file.parentPath, file.name);
    const path = `worksheets/bundled/${relative(root, filename).split(sep).join("/")}`;
    const { error: uploadError } = await storage.from(bucketName).upload(path, await readFile(filename), {
      contentType: file.name.endsWith(".png") ? "image/png" : "image/webp",
      cacheControl: "0",
      upsert: false,
    });
    if (!uploadError) uploaded++;
    else if (uploadError.statusCode !== "409" && uploadError.statusCode !== 409) {
      throw new Error(`Upload failed for ${path}: ${uploadError.message}`);
    }
  }
  console.log(`Uploaded ${uploaded} originals. ${files.length - uploaded} were already present.`);
}
