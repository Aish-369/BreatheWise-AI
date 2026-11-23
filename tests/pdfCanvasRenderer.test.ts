// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { jsPDF } from 'jspdf';
import {
  ensureDevanagariFontsReady,
  renderMultilingualCanvasPdf,
  type PdfReportModel,
} from '../src/utils/pdfCanvasRenderer';

function createModel(overrides: Partial<PdfReportModel> = {}): PdfReportModel {
  return {
    filename: 'breathewise-report-pune-mr.pdf',
    title: 'श्वास सुरक्षित ठेवा',
    subtitle: 'कुटुंब · पुणे',
    banners: ['नमुना माहिती'],
    evidenceSectionTitle: 'पुरावे',
    evidenceLines: ['AQI: 120', 'स्रोत: CPCB'],
    summaryText: 'आज बाहेरील हालचाली कमी ठेवा.',
    recommendationsTitle: 'शिफारसी',
    recommendationBlocks: [
      {
        title: 'कुटुंबाचे संरक्षण',
        members: 'सर्व सदस्य',
        action: 'घरातच व्यायाम करा',
        basis: 'PM2.5 पातळी जास्त आहे',
        reconsider: 'नवीन मोजमापानंतर पुन्हा तपासा',
      },
    ],
    scheduleTitle: 'दैनिक नियोजन',
    scheduleBlocks: [{ header: 'सकाळची चाल', rationale: 'हवेची गुणवत्ता सुधारल्यावरच बाहेर जा.' }],
    limitationsTitle: 'मर्यादा',
    limitations: ['स्थानिक मोजमाप उपलब्ध नाही'],
    disclaimer: 'ही माहिती वैद्यकीय सल्ला नाही.',
    containsDevanagari: true,
    ...overrides,
  };
}

function installCanvasMocks() {
  const context = {
    fillStyle: '',
    font: '',
    measureText: vi.fn((text: string) => ({ width: text.length * 16 })),
    fillRect: vi.fn(),
    fillText: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/png;base64,ZmFrZQ=='
  );
  return context;
}

function createDoc() {
  return {
    internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
    addPage: vi.fn(),
    addImage: vi.fn(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('multilingual canvas PDF renderer', () => {
  it('returns safely when the browser Font Loading API is unavailable', async () => {
    Object.defineProperty(document, 'fonts', { configurable: true, value: undefined });
    await expect(ensureDevanagariFontsReady()).resolves.toBeUndefined();
  });

  it('requests the regular, semibold, and bold Devanagari font faces', async () => {
    const load = vi.fn().mockResolvedValue([]);
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve(), load },
    });

    await ensureDevanagariFontsReady();

    expect(load).toHaveBeenCalledTimes(3);
    expect(load).toHaveBeenCalledWith('400 20px "Noto Sans Devanagari"', expect.any(String));
    expect(load).toHaveBeenCalledWith('600 20px "Noto Sans Devanagari"', expect.any(String));
    expect(load).toHaveBeenCalledWith('700 30px "Noto Sans Devanagari"', expect.any(String));
  });

  it('renders a multilingual report to a single PDF page', () => {
    const context = installCanvasMocks();
    const doc = createDoc();

    renderMultilingualCanvasPdf(doc as unknown as jsPDF, createModel());

    expect(context.fillText).toHaveBeenCalled();
    expect(doc.addPage).not.toHaveBeenCalled();
    expect(doc.addImage).toHaveBeenCalledTimes(1);
    expect(doc.addImage).toHaveBeenCalledWith(
      'data:image/png;base64,ZmFrZQ==',
      'PNG',
      0,
      0,
      595,
      842,
      undefined,
      'FAST'
    );
  });

  it('creates additional PDF pages for long schedules and omits an empty limitations section', () => {
    installCanvasMocks();
    const doc = createDoc();
    const scheduleBlocks = Array.from({ length: 80 }, (_, index) => ({
      header: `दिनक्रम ${index + 1}`,
      rationale: 'हवेची गुणवत्ता आणि कुटुंबाच्या सुरक्षिततेनुसार वेळ निवडा.',
    }));

    renderMultilingualCanvasPdf(
      doc as unknown as jsPDF,
      createModel({ banners: [], recommendationBlocks: [], limitations: [], scheduleBlocks })
    );

    expect(doc.addPage).toHaveBeenCalled();
    expect(doc.addImage.mock.calls.length).toBeGreaterThan(1);
  });
});
