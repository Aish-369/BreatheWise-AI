// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { jsPDF } from 'jspdf';
import type { PdfReportModel } from '../src/utils/pdfCanvasRenderer';
import { renderStandardPdf } from '../src/utils/pdfStandardRenderer';

function createDoc() {
  return {
    internal: { pageSize: { getWidth: () => 595 } },
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    addFileToVFS: vi.fn(),
    addFont: vi.fn(),
  };
}

function createModel(overrides: Partial<PdfReportModel> = {}): PdfReportModel {
  return {
    filename: 'breathewise-report-pune-en.pdf',
    title: 'Title ≤ 2 ≥ 1 → — µ³',
    subtitle: 'Household · Pune',
    banners: ['Illustrative sample data'],
    evidenceSectionTitle: 'Evidence',
    evidenceLines: ['AQI ≥ 100'],
    summaryText: 'Move activities indoors →',
    recommendationsTitle: 'Recommendations',
    recommendationBlocks: [
      {
        title: 'Protect family',
        members: 'Members: everyone',
        action: 'Stay indoors',
        basis: 'Reason: elevated PM2.5',
        reconsider: 'Reconsider: after new station reading',
      },
    ],
    scheduleTitle: 'Daily plan',
    scheduleBlocks: [{ header: 'Morning [06:00-09:00]', rationale: 'Avoid outdoor exertion' }],
    limitationsTitle: 'Limitations',
    limitations: ['Provider reading unavailable'],
    disclaimer: 'Informational guidance — not medical advice',
    containsDevanagari: false,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('renderStandardPdf', () => {
  it('falls back to Helvetica and sanitizes glyphs when bundled fonts are unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);
    const doc = createDoc();

    await renderStandardPdf(doc as unknown as jsPDF, createModel());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(doc.setFont).toHaveBeenCalledWith('helvetica', 'bold');
    const renderedText = doc.text.mock.calls.map(([text]) => String(text));
    expect(renderedText).toContain('Title <= 2 >= 1 -> - u3');
    expect(renderedText).toContain('AQI >= 100');
  });

  it('embeds both DejaVu font weights when font assets are available', async () => {
    const fontBuffer = new Uint8Array([1, 2, 3]).buffer;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(fontBuffer),
    });
    vi.stubGlobal('fetch', fetchMock);
    const doc = createDoc();

    await renderStandardPdf(doc as unknown as jsPDF, createModel());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(doc.addFileToVFS).toHaveBeenCalledTimes(2);
    expect(doc.addFont).toHaveBeenCalledWith('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    expect(doc.addFont).toHaveBeenCalledWith('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
    expect(doc.setFont).toHaveBeenCalledWith('DejaVuSans', 'bold');
  });

  it('adds pages when a long report exceeds the available page height', async () => {
    const doc = createDoc();
    const recommendations = Array.from({ length: 36 }, (_, index) => ({
      title: `Recommendation ${index + 1}`,
      members: 'Members: all household members',
      action: 'Move the activity indoors',
      basis: 'Reason: measured pollution is elevated',
      reconsider: 'Reconsider after the next verified update',
    }));

    await renderStandardPdf(
      doc as unknown as jsPDF,
      createModel({
        banners: ['Illustrative sample data', 'Scenario only'],
        recommendationBlocks: recommendations,
        scheduleBlocks: Array.from({ length: 12 }, (_, index) => ({
          header: `Routine ${index + 1}`,
          rationale: 'Choose a lower-exposure activity window',
        })),
        limitations: ['Provider unavailable', 'Forecast grid is coarse'],
      })
    );

    expect(doc.addPage).toHaveBeenCalled();
    expect(doc.text).toHaveBeenCalled();
  });
});
