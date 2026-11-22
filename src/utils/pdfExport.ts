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

  // Brand header card on page 1
  page.ctx.fillStyle = '#263C32';
  page.ctx.fillRect(marginX, page.y - 16, maxWidth, 118);
  page.ctx.fillStyle = '#FFFFFF';
  page.ctx.font = `700 32px ${fontStack}`;
  page.ctx.fillText(model.title, marginX + 28, page.y + 30);
  page.ctx.fillStyle = '#DCE9DD';
  page.ctx.font = `400 20px ${fontStack}`;
  page.ctx.fillText(model.subtitle, marginX + 28, page.y + 68);
  page.y += 136;

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

  drawText(model.evidenceSectionTitle, { size: 24, weight: 700, color: '#263C32', gap: 8 });
  for (const line of model.evidenceLines) {
    drawText(line, { size: 19, color: '#252D28', gap: 6 });
  }
  drawText(model.summaryText, { size: 20, weight: 600, color: '#252D28', gap: 18 });

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

  drawText(model.scheduleTitle, { size: 24, weight: 700, color: '#263C32', gap: 10 });
  for (const item of model.scheduleBlocks) {
    ensureSpace(80);
    drawText(`• ${item.header}`, { size: 20, weight: 700, color: '#252D28', gap: 4 });
    drawText(item.rationale, { size: 18, color: '#5D665E', gap: 12, indent: 18 });
  }

  if (model.limitations.length > 0) {
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

export function exportProtectionPlanPdf(
  household: HouseholdProfile,
  plan: ProtectionPlanResult,
  lang: LanguageCode
): void {
  const model = buildPdfReportModel(household, plan, lang);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  if (model.containsDevanagari && typeof document !== 'undefined') {
    renderMultilingualCanvasPdf(doc, model);
    doc.save(model.filename);
    return;
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

  const writeLine = (text: string, size = 10, bold = false, gap = 16) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      if (y > 760) {
        doc.addPage();
        y = 52;
      }
      doc.text(line, margin, y);
      y += size + 4;
    }
    y += gap - (size + 4);
  };

  doc.setTextColor(38, 60, 50);
  writeLine(model.title, 18, true, 26);

  doc.setTextColor(82, 96, 113);
  writeLine(model.subtitle, 9, false, 18);

  for (const banner of model.banners) {
    writeLine(banner, 9, true, 16);
  }

  doc.setDrawColor(226, 231, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setTextColor(37, 45, 40);
  writeLine(`1. ${model.evidenceSectionTitle}`, 13, true, 20);
  for (const line of model.evidenceLines) {
    writeLine(line, 10, false, 15);
  }
  writeLine(model.summaryText, 10, false, 22);

  writeLine(`2. ${model.recommendationsTitle}`, 13, true, 20);
  for (const rec of model.recommendationBlocks) {
    writeLine(`• ${rec.title}`, 10, true, 15);
    writeLine(`  ${rec.members}`, 9, false, 14);
    writeLine(`  ${rec.action}`, 9, false, 14);
    writeLine(`  ${rec.basis}`, 9, false, rec.reconsider ? 14 : 18);
    if (rec.reconsider) {
      writeLine(`  ${rec.reconsider}`, 9, false, 18);
    }
  }

  writeLine(`3. ${model.scheduleTitle}`, 13, true, 20);
  for (const item of model.scheduleBlocks) {
    writeLine(`• ${item.header}`, 10, true, 15);
    writeLine(`  ${item.rationale}`, 9, false, 16);
  }

  if (model.limitations.length > 0) {
    writeLine('4. Data Quality Warnings & Limitations', 13, true, 20);
    for (const lim of model.limitations) {
      writeLine(`- ${lim}`, 9, false, 14);
    }
  }

  writeLine(model.disclaimer, 8, false, 14);
  doc.save(model.filename);
}
