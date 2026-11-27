import { PageSizes, PDFDocument } from "pdf-lib";

export async function createGroupPrintPdf(documents: { blob: Blob; pdf: boolean }[]) {
  const output = await PDFDocument.create();
  for (const document of documents) {
    if (document.pdf) {
      const source = await PDFDocument.load(await document.blob.arrayBuffer());
      const pages = await output.copyPages(source, source.getPageIndices());
      for (const page of pages) output.addPage(page);
      continue;
    }

    const bitmap = await createImageBitmap(document.blob);
    const canvas = window.document.createElement("canvas");
    try {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Could not prepare the print page.");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0);

      const image = await output.embedJpg(canvas.toDataURL("image/jpeg", 0.95));
      const [short, long] = PageSizes.A4;
      const [width, height] = image.width <= image.height ? [short, long] : [long, short];
      const page = output.addPage([width, height]);
      const size = image.scaleToFit(width - 36, height - 36);
      page.drawImage(image, { ...size, x: (width - size.width) / 2, y: (height - size.height) / 2 });
    } finally {
      bitmap.close();
      canvas.width = canvas.height = 0;
    }
  }
  return new Blob([new Uint8Array(await output.save())], { type: "application/pdf" });
}
