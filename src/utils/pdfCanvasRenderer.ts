import type { jsPDF } from 'jspdf';

export interface PdfReportModel {
  filename: string;
  title: string;
  subtitle: string;
  banners: string[];
  evidenceSectionTitle: string;
  evidenceLines: string[];
  summaryText: string;
  recommendationsTitle: string;
  recommendationBlocks: Array<{
    title: string;
    members: string;
    action: string;
    basis: string;
    reconsider?: string;
  }>;
  scheduleTitle: string;
  scheduleBlocks: Array<{
    header: string;
    rationale: string;
  }>;
  limitationsTitle: string;
  limitations: string[];
  disclaimer: string;
  containsDevanagari: boolean;
}

const FONT_STACK = '"Noto Sans Devanagari", "DM Sans", "DejaVu Sans", sans-serif';
const CANVAS_W = 1240;
const CANVAS_H = 1754;
const MARGIN_X = 88;
const MAX_WIDTH = CANVAS_W - MARGIN_X * 2;

interface CanvasPage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  y: number;
}

function wrapCanvasLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function createCanvasPage(pages: CanvasPage[]): CanvasPage {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const page = { canvas, ctx, y: 88 };
  pages.push(page);
  return page;
}

function drawCanvasHeader(page: CanvasPage, model: PdfReportModel): void {
  page.ctx.font = `700 30px ${FONT_STACK}`;
  const titleLines = wrapCanvasLines(page.ctx, model.title, MAX_WIDTH - 56);
  page.ctx.font = `400 19px ${FONT_STACK}`;
  const subtitleLines = wrapCanvasLines(page.ctx, model.subtitle, MAX_WIDTH - 56);
  const bannerHeight = 44 + titleLines.length * 40 + subtitleLines.length * 28;

  page.ctx.fillStyle = '#263C32';
  page.ctx.fillRect(MARGIN_X, page.y - 16, MAX_WIDTH, bannerHeight);

  let headerY = page.y + 24;
  page.ctx.fillStyle = '#FFFFFF';
  page.ctx.font = `700 30px ${FONT_STACK}`;
  for (const line of titleLines) {
    page.ctx.fillText(line, MARGIN_X + 28, headerY);
    headerY += 40;
  }

  page.ctx.fillStyle = '#DCE9DD';
  page.ctx.font = `400 19px ${FONT_STACK}`;
  for (const line of subtitleLines) {
    page.ctx.fillText(line, MARGIN_X + 28, headerY);
    headerY += 28;
  }
  page.y += bannerHeight + 18;
}

export async function ensureDevanagariFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    const devanagariSample = 'कखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहमराठीहिन्दी';
    await Promise.race([
      Promise.all([
        document.fonts.ready,
        document.fonts.load('400 20px "Noto Sans Devanagari"', devanagariSample),
        document.fonts.load('600 20px "Noto Sans Devanagari"', devanagariSample),
        document.fonts.load('700 30px "Noto Sans Devanagari"', devanagariSample),
      ]),
      new Promise<void>((resolve) => setTimeout(resolve, 4000)),
    ]);
  } catch {
    // Proceed cleanly with best available font fallback
  }
}

export function renderMultilingualCanvasPdf(doc: jsPDF, model: PdfReportModel): void {
  const pages: CanvasPage[] = [];
  let page = createCanvasPage(pages);
  drawCanvasHeader(page, model);

  const ensureSpace = (needed: number) => {
    if (page.y + needed > CANVAS_H - 90) {
      page = createCanvasPage(pages);
    }
  };

  const drawText = (
    text: string,
    options: {
      size?: number;
      weight?: 400 | 600 | 700;
      color?: string;
      gap?: number;
      indent?: number;
    } = {}
  ) => {
    const size = options.size ?? 20;
    const weight = options.weight ?? 400;
    const color = options.color ?? '#252D28';
    const gap = options.gap ?? 10;
    const indent = options.indent ?? 0;

    page.ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    page.ctx.fillStyle = color;
    const lines = wrapCanvasLines(page.ctx, text, MAX_WIDTH - indent);
    const lineHeight = Math.round(size * 1.48);

    for (const line of lines) {
      ensureSpace(lineHeight + 4);
      page.ctx.font = `${weight} ${size}px ${FONT_STACK}`;
      page.ctx.fillStyle = color;
      page.ctx.fillText(line, MARGIN_X + indent, page.y);
      page.y += lineHeight;
    }
    page.y += gap;
  };

  for (const banner of model.banners) {
    drawText(`• ${banner}`, { size: 19, weight: 600, color: '#8E5312', gap: 10 });
  }

  ensureSpace(140);
  drawText(model.evidenceSectionTitle, { size: 24, weight: 700, color: '#263C32', gap: 8 });
  for (const line of model.evidenceLines) {
    drawText(line, { size: 19, color: '#252D28', gap: 6 });
  }
  drawText(model.summaryText, { size: 20, weight: 600, color: '#252D28', gap: 18 });

  ensureSpace(160);
  drawText(model.recommendationsTitle, { size: 24, weight: 700, color: '#263C32', gap: 10 });
  for (const rec of model.recommendationBlocks) {
    ensureSpace(120);
    drawText(`• ${rec.title}`, { size: 20, weight: 700, color: '#252D28', gap: 4 });
    drawText(rec.members, { size: 18, color: '#5D665E', gap: 4, indent: 18 });
    drawText(rec.action, { size: 19, weight: 600, color: '#263C32', gap: 4, indent: 18 });
    drawText(rec.basis, { size: 18, color: '#5D665E', gap: rec.reconsider ? 4 : 12, indent: 18 });
    if (rec.reconsider) {
      drawText(rec.reconsider, { size: 18, color: '#5D665E', gap: 12, indent: 18 });
    }
  }

  ensureSpace(140);
  drawText(model.scheduleTitle, { size: 24, weight: 700, color: '#263C32', gap: 10 });
  for (const item of model.scheduleBlocks) {
    ensureSpace(80);
    drawText(`• ${item.header}`, { size: 20, weight: 700, color: '#252D28', gap: 4 });
    drawText(item.rationale, { size: 18, color: '#5D665E', gap: 12, indent: 18 });
  }

  if (model.limitations.length > 0) {
    ensureSpace(120);
    drawText(model.limitationsTitle, { size: 22, weight: 700, color: '#263C32', gap: 8 });
    for (const lim of model.limitations) {
      drawText(`- ${lim}`, { size: 18, color: '#5D665E', gap: 6 });
    }
  }

  page.y += 10;
  drawText(model.disclaimer, { size: 17, color: '#5D665E', gap: 8 });

  const pdfW = doc.internal.pageSize.getWidth();
  const pdfH = doc.internal.pageSize.getHeight();
  pages.forEach((p, idx) => {
    if (idx > 0) doc.addPage();
    doc.addImage(p.canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
  });
}
