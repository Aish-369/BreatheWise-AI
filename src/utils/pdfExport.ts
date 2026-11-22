import { jsPDF } from 'jspdf';
import type { HouseholdProfile, LanguageCode, ProtectionPlanResult } from '../shared/types';
import { t } from '../i18n/translations';

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

const DEVANAGARI_RE = /[\u0900-\u097F]/;

export function buildPdfReportModel(
  household: HouseholdProfile,
  plan: ProtectionPlanResult,
  lang: LanguageCode
): PdfReportModel {
  const banners: string[] = [];
  if (plan.isDemoFixture) {
    banners.push(t(lang, 'demo_fixture_notice'));
  }
  if (plan.isScenario) {
    banners.push(t(lang, 'scenario_banner'));
  }

  const evidenceLines = [
    `${t(lang, 'dash_aqi_label')}: ${
      plan.aqiValue !== null
        ? `${plan.aqiValue} (${t(lang, `band_${plan.aqiBand}`)})`
        : t(lang, 'band_unavailable')
    } ${plan.aqiIsDerived ? `[${t(lang, 'dash_derived_note')}]` : ''}`,
    `${t(lang, 'dash_source')}: ${plan.supportingEvidence.providerLabel} | ${plan.supportingEvidence.stationOrGridId}`,
    `${t(lang, 'dash_confidence')}: ${t(lang, `dtype_${plan.dataType}`)} · ${t(
      lang,
      `fresh_${plan.freshness}`
    )} · ${t(lang, 'dash_measured_at')}: ${
      plan.supportingEvidence.measuredAt
        ? new Date(plan.supportingEvidence.measuredAt).toLocaleString()
        : 'N/A'
    }`,
  ];

  const recommendationBlocks = plan.recommendations.map((rec) => ({
    title: t(lang, rec.titleKey, rec.titleParams),
    members: `${t(lang, 'dash_applicable_members')}: ${rec.applicableMembers.join(', ') || household.name}`,
    action: t(lang, rec.suggestedActionKey, rec.suggestedActionParams),
    basis: `${t(lang, 'dash_reasonLabel')}: ${t(lang, rec.reasonGeneratedKey, rec.reasonGeneratedParams)}`,
    reconsider: rec.reconsiderWhenKey
      ? `${t(lang, 'trail_reconsider_label')}: ${t(lang, rec.reconsiderWhenKey)}`
      : undefined,
  }));

  const scheduleBlocks = plan.dailyPlan.map((item) => {
    const windowStr = item.suggestedWindow
      ? `${item.originalWindow} -> ${item.suggestedWindow}`
      : item.originalWindow;
    return {
      header: `${item.routineTitle} [${windowStr}] — ${t(lang, `status_${item.status}`)}`,
      rationale: t(lang, item.rationaleKey, item.rationaleParams),
    };
  });

  const model: PdfReportModel = {
    filename: `breathewise-report-${plan.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${lang}.pdf`,
    title: `${t(lang, 'brandName')} — ${t(lang, 'dash_title')}`,
    subtitle: `${household.name} · ${plan.city} · ${new Date(plan.generatedAt).toLocaleString()}`,
    banners,
    evidenceSectionTitle: t(lang, 'dash_evidence_heading'),
    evidenceLines,
    summaryText: t(lang, plan.summaryKey, plan.summaryParams),
    recommendationsTitle: t(lang, 'dash_actions_heading'),
    recommendationBlocks,
    scheduleTitle: t(lang, 'dash_planner_heading'),
    scheduleBlocks,
    limitationsTitle: t(lang, 'dash_evidence_heading'),
    limitations: plan.limitations,
    disclaimer: t(lang, 'ui_pdf_disclaimer'),
    containsDevanagari: false,
  };

  const joined = [
    model.title,
    model.subtitle,
    model.summaryText,
    ...model.banners,
    ...model.evidenceLines,
    ...model.recommendationBlocks.flatMap((r) => [r.title, r.action, r.basis, r.reconsider ?? '']),
    ...model.scheduleBlocks.flatMap((s) => [s.header, s.rationale]),
    model.disclaimer,
  ].join(' ');

  model.containsDevanagari = lang === 'mr' || lang === 'hi' || DEVANAGARI_RE.test(joined);
  return model;
}

function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
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

function renderMultilingualCanvasPdf(doc: jsPDF, model: PdfReportModel): void {
  // High-DPI A4 page canvas (1240 x 1754 px ~ 150 DPI)
  const canvasW = 1240;
  const canvasH = 1754;
  const marginX = 88;
  const maxWidth = canvasW - marginX * 2;
  const fontStack = '"Noto Sans Devanagari", "DM Sans", "DejaVu Sans", sans-serif';

  const pages: HTMLCanvasElement[] = [];

  const newPageCanvas = (): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; y: number } => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasW, canvasH);
    pages.push(canvas);
    return { canvas, ctx, y: 88 };
  };

  let page = newPageCanvas();

  // Brand header card on page 1 with dynamic wrapping to prevent right-edge clipping
  page.ctx.font = `700 30px ${fontStack}`;
  const titleLines = wrapCanvasLines(page.ctx, model.title, maxWidth - 56);
  page.ctx.font = `400 19px ${fontStack}`;
  const subtitleLines = wrapCanvasLines(page.ctx, model.subtitle, maxWidth - 56);
  const bannerHeight = 44 + titleLines.length * 40 + subtitleLines.length * 28;

  page.ctx.fillStyle = '#263C32';
  page.ctx.fillRect(marginX, page.y - 16, maxWidth, bannerHeight);
  let headerY = page.y + 24;
  page.ctx.fillStyle = '#FFFFFF';
  page.ctx.font = `700 30px ${fontStack}`;
  for (const line of titleLines) {
    page.ctx.fillText(line, marginX + 28, headerY);
    headerY += 40;
  }
  page.ctx.fillStyle = '#DCE9DD';
  page.ctx.font = `400 19px ${fontStack}`;
  for (const line of subtitleLines) {
    page.ctx.fillText(line, marginX + 28, headerY);
    headerY += 28;
  }
  page.y += bannerHeight + 18;

  const ensureSpace = (needed: number) => {
    if (page.y + needed > canvasH - 90) {
      page = newPageCanvas();
    }
  };

  const drawText = (
    text: string,
    options: { size?: number; weight?: 400 | 600 | 700; color?: string; gap?: number; indent?: number } = {}
  ) => {
    const size = options.size ?? 20;
    const weight = options.weight ?? 400;
    const color = options.color ?? '#252D28';
    const gap = options.gap ?? 10;
    const indent = options.indent ?? 0;

    page.ctx.font = `${weight} ${size}px ${fontStack}`;
    page.ctx.fillStyle = color;
    const lines = wrapCanvasLines(page.ctx, text, maxWidth - indent);
    const lineHeight = Math.round(size * 1.48);

    for (const line of lines) {
      ensureSpace(lineHeight + 4);
      page.ctx.font = `${weight} ${size}px ${fontStack}`;
      page.ctx.fillStyle = color;
      page.ctx.fillText(line, marginX + indent, page.y);
      page.y += lineHeight;
    }
    page.y += gap;
  };

  for (const b of model.banners) {
    drawText(`• ${b}`, { size: 19, weight: 600, color: '#8E5312', gap: 10 });
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
  pages.forEach((canvas, idx) => {
    if (idx > 0) doc.addPage();
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
  });
}

async function ensureDevanagariFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    // Explicit Devanagari sample text triggers unicode-range subset .woff2 downloads immediately
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

export async function exportProtectionPlanPdf(
  household: HouseholdProfile,
  plan: ProtectionPlanResult,
  lang: LanguageCode
): Promise<void> {
  const model = buildPdfReportModel(household, plan, lang);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  if (model.containsDevanagari && typeof document !== 'undefined') {
    await ensureDevanagariFontsReady();
    renderMultilingualCanvasPdf(doc, model);
    doc.save(model.filename);
    return;
  }

  const hasEmbeddedFont = await tryEmbedDejaVuFonts(doc);
  const fontName = hasEmbeddedFont ? 'DejaVuSans' : 'helvetica';
  const prep = (text: string) => (hasEmbeddedFont ? text : sanitizeForWinAnsi(text));

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

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

  // Forest green branded header banner for parity across languages
  doc.setFont(fontName, 'bold');
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(prep(model.title), maxWidth - 28) as string[];
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  const subtitleLines = doc.splitTextToSize(prep(model.subtitle), maxWidth - 28) as string[];
  const headerH = 26 + titleLines.length * 20 + subtitleLines.length * 13;

  doc.setFillColor(38, 60, 50);
  doc.rect(margin, y - 14, maxWidth, headerH, 'F');

  let headerY = y + 6;
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
  y += headerH + 8;

  doc.setTextColor(142, 83, 18);
  for (const banner of model.banners) {
    writeLine(`• ${banner}`, 9, true, 16);
  }

  doc.setTextColor(37, 45, 40);
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
  doc.save(model.filename);
}
