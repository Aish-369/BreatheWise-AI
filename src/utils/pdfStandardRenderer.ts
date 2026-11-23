import type { jsPDF } from 'jspdf';
import type { PdfReportModel } from './pdfCanvasRenderer';

let cachedLatinFonts: { regular: string; bold: string } | null = null;

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function tryEmbedDejaVuFonts(doc: jsPDF): Promise<boolean> {
  if (typeof fetch !== 'function' || typeof btoa !== 'function') return false;
  try {
    if (!cachedLatinFonts) {
      const [regRes, boldRes] = await Promise.all([
        fetch('/fonts/DejaVuSans.ttf'),
        fetch('/fonts/DejaVuSans-Bold.ttf'),
      ]);
      if (!regRes.ok || !boldRes.ok) return false;
      const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
      cachedLatinFonts = {
        regular: arrayBufferToBase64(regBuf),
        bold: arrayBufferToBase64(boldBuf),
      };
    }
    doc.addFileToVFS('DejaVuSans.ttf', cachedLatinFonts.regular);
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.addFileToVFS('DejaVuSans-Bold.ttf', cachedLatinFonts.bold);
    doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
    return true;
  } catch {
    return false;
  }
}

function sanitizeForWinAnsi(text: string): string {
  return text
    .replaceAll('≤', '<=')
    .replaceAll('≥', '>=')
    .replaceAll('→', '->')
    .replaceAll('—', '-')
    .replaceAll('µ', 'u')
    .replaceAll('³', '3');
}

function drawStandardHeader(
  doc: jsPDF,
  model: PdfReportModel,
  fontName: string,
  prep: (text: string) => string,
  margin: number,
  maxWidth: number,
  startY: number
): number {
  doc.setFont(fontName, 'bold');
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(prep(model.title), maxWidth - 28) as string[];
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  const subtitleLines = doc.splitTextToSize(prep(model.subtitle), maxWidth - 28) as string[];
  const headerH = 26 + titleLines.length * 20 + subtitleLines.length * 13;

  doc.setFillColor(38, 60, 50);
  doc.rect(margin, startY - 14, maxWidth, headerH, 'F');

  let headerY = startY + 6;
  doc.setTextColor(255, 255, 255);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(15);
  for (const line of titleLines) {
    doc.text(line, margin + 14, headerY);
    headerY += 20;
  }

  doc.setTextColor(220, 233, 221);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  for (const line of subtitleLines) {
    doc.text(line, margin + 14, headerY);
    headerY += 13;
  }

  return startY + headerH + 8;
}

export async function renderStandardPdf(doc: jsPDF, model: PdfReportModel): Promise<void> {
  const hasEmbeddedFont = await tryEmbedDejaVuFonts(doc);
  const fontName = hasEmbeddedFont ? 'DejaVuSans' : 'helvetica';
  const prep = (text: string) => (hasEmbeddedFont ? text : sanitizeForWinAnsi(text));

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = drawStandardHeader(doc, model, fontName, prep, margin, maxWidth, 52);

  const ensureSpace = (needed: number) => {
    if (y + needed > 780) {
      doc.addPage();
      y = 52;
    }
  };

  const writeLine = (text: string, size = 10, bold = false, gap = 16, indent = 0) => {
    doc.setFont(fontName, bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(prep(text), maxWidth - indent) as string[];
    const step = Math.round(size * 1.4);
    for (const line of lines) {
      ensureSpace(step);
      doc.text(line, margin + indent, y);
      y += step;
    }
    y += Math.max(2, gap - step);
  };

  doc.setTextColor(142, 83, 18);
  for (const banner of model.banners) {
    writeLine(`• ${banner}`, 9, true, 16);
  }

  ensureSpace(64);
  doc.setTextColor(38, 60, 50);
  writeLine(`1. ${model.evidenceSectionTitle}`, 12.5, true, 20);
  doc.setTextColor(37, 45, 40);
  for (const line of model.evidenceLines) {
    writeLine(line, 9.5, false, 15);
  }
  writeLine(model.summaryText, 10, true, 22);

  ensureSpace(72);
  doc.setTextColor(38, 60, 50);
  writeLine(`2. ${model.recommendationsTitle}`, 12.5, true, 20);
  for (const rec of model.recommendationBlocks) {
    ensureSpace(70);
    doc.setTextColor(37, 45, 40);
    writeLine(`• ${rec.title}`, 10, true, 14);
    doc.setTextColor(93, 102, 94);
    writeLine(rec.members, 9, false, 13, 10);
    doc.setTextColor(38, 60, 50);
    writeLine(rec.action, 9.5, true, 14, 10);
    doc.setTextColor(93, 102, 94);
    writeLine(rec.basis, 8.8, false, rec.reconsider ? 13 : 18, 10);
    if (rec.reconsider) {
      writeLine(rec.reconsider, 8.8, false, 18, 10);
    }
  }

  ensureSpace(68);
  doc.setTextColor(38, 60, 50);
  writeLine(`3. ${model.scheduleTitle}`, 12.5, true, 20);
  for (const item of model.scheduleBlocks) {
    ensureSpace(44);
    doc.setTextColor(37, 45, 40);
    writeLine(`• ${item.header}`, 10, true, 14);
    doc.setTextColor(93, 102, 94);
    writeLine(item.rationale, 9, false, 17, 10);
  }

  if (model.limitations.length > 0) {
    ensureSpace(60);
    doc.setTextColor(38, 60, 50);
    writeLine('4. Data Quality Warnings & Limitations', 12, true, 18);
    doc.setTextColor(93, 102, 94);
    for (const lim of model.limitations) {
      writeLine(`- ${lim}`, 9, false, 14);
    }
  }

  y += 6;
  doc.setTextColor(93, 102, 94);
  writeLine(model.disclaimer, 8.2, false, 14);
}
