import { PDFDocument, PageSizes } from "pdf-lib";

export async function imageToPdf(image: HTMLImageElement) {
  const { naturalWidth, naturalHeight } = image;
  const canvas = document.createElement("canvas");
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context unavailable");
  context.drawImage(image, 0, 0);

  const pdf = await PDFDocument.create();
  const [shortSide, longSide] = PageSizes.A4;
  const page = pdf.addPage(naturalWidth > naturalHeight ? [longSide, shortSide] : PageSizes.A4);
  const { width, height } = page.getSize();
  const embedded = await pdf.embedPng(canvas.toDataURL("image/png"));
  const fitted = embedded.scaleToFit(width, height);
  page.drawImage(embedded, {
    ...fitted,
    x: (width - fitted.width) / 2,
    y: (height - fitted.height) / 2,
  });
  return new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" });
}
