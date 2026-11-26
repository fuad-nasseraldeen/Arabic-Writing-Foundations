export const worksheetBucket = "worksheet-files";

export function isWorksheetPath(path: string) {
  return /^worksheets\/(?:[a-z\d_-]+\/)*[a-z\d_-][a-z\d_.-]*\.(?:pdf|png|jpe?g|webp)$/i.test(path);
}

export function resolveWorksheetPath(reference: string, supabaseUrl: string) {
  if (isWorksheetPath(reference)) return reference;
  try {
    const url = new URL(reference);
    const prefix = "/storage/v1/object/public/site-media/";
    if (url.origin !== new URL(supabaseUrl).origin || !url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    return isWorksheetPath(path) ? path : null;
  } catch {
    return null;
  }
}
