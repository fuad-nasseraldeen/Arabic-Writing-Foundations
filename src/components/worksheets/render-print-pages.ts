import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).href;

export async function renderPrintPages(url: string, signal: AbortSignal, addPage: (blob: Blob) => void) {
  const task = getDocument({ url, useWasm: false });
  const canvas = document.createElement("canvas");
  try {
    const pdf = await task.promise;
    for (let number = 1; number <= pdf.numPages; number++) {
      signal.throwIfAborted();
      const page = await pdf.getPage(number);
      const viewport = page.getViewport({ scale: 2 });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const image = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Print page unavailable")), "image/jpeg", 0.94);
      });
      signal.throwIfAborted();
      addPage(image);
      page.cleanup();
    }
  } finally {
    canvas.width = canvas.height = 0;
    await task.destroy();
  }
}
