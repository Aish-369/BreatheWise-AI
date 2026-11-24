// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HouseholdProfile, ProtectionPlanResult } from '../src/shared/types';
import {
  buildPdfReportModel,
  exportProtectionPlanPdf,
} from '../src/utils/pdfExport';

const pdfMocks = vi.hoisted(() => ({
  save: vi.fn(),
  renderStandard: vi.fn(),
  renderCanvas: vi.fn(),
  ensureFonts: vi.fn(),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({ save: pdfMocks.save })),
}));
vi.mock('../src/utils/pdfStandardRenderer', () => ({
  renderStandardPdf: pdfMocks.renderStandard,
}));
vi.mock('../src/utils/pdfCanvasRenderer', () => ({
  ensureDevanagariFontsReady: pdfMocks.ensureFonts,
  renderMultilingualCanvasPdf: pdfMocks.renderCanvas,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  pdfMocks.save.mockReset();
  pdfMocks.renderStandard.mockReset();
  pdfMocks.renderCanvas.mockReset();
  pdfMocks.ensureFonts.mockReset();
});

const household = {
  id: 'household-1',
  name: 'Pawar Family',
  city: 'Pune',
  locality: 'Shivajinagar',
  language: 'en',
  sensitivityTags: [],
} as unknown as HouseholdProfile;

function makePlan(overrides: Partial<ProtectionPlanResult> = {}): ProtectionPlanResult {
  return {
    id: 'plan-1',
    generatedAt: '2026-11-24T06:00:00.000Z',
    city: 'Pune',
    aqiValue: 82,
    aqiIsDerived: false,
    aqiBand: 'satisfactory',
    dominantPollutant: 'pm25',
    freshness: 'fresh',
    dataType: 'physical_station',
    isAvailable: true,
    isDemoFixture: true,
    isScenario: true,
    conflictWarningKey: null,
    conflictDetails: null,
    summaryKey: 'dash_summary_good',
    summaryParams: {},
    limitations: ['dash_summary_good'],
    recommendations: [
      {
        id: 'rec-1',
        titleKey: 'dash_summary_good',
        titleParams: {},
        applicableMembers: [],
        suggestedActionKey: 'dash_summary_good',
        suggestedActionParams: {},
        reasonGeneratedKey: 'dash_summary_good',
        reasonGeneratedParams: {},
        reconsiderWhenKey: 'dash_summary_good',
      },
    ],
    dailyPlan: [
      {
        routineId: 'routine-1',
        routineTitle: 'Morning walk',
        environment: 'outdoor',
        flexibility: 'flexible',
        originalWindow: '06:00-09:00',
        suggestedWindow: '09:00-12:00',
        status: 'adjust_window',
        applicableMembers: ['Asha'],
        rationaleKey: 'dash_summary_good',
        limitationKey: null,
        evidenceTimestamp: '2026-11-24T05:30:00.000Z',
      },
    ],
    supportingEvidence: {
      providerLabel: 'CPCB',
      stationOrGridId: 'Pune-1',
      dataType: 'physical_station',
      measuredAt: null,
      retrievedAt: '2026-11-24T06:00:00.000Z',
      freshness: 'fresh',
      pm25: 42,
      pm10: 70,
      aqiValue: 82,
      aqiIsDerived: false,
      isDemoFixture: true,
    },
    ...overrides,
  } as unknown as ProtectionPlanResult;
}

describe('buildPdfReportModel', () => {
  it('preserves provenance, demo/scenario disclaimers, and household fallbacks', () => {
    const model = buildPdfReportModel(household, makePlan(), 'en');

    expect(model.filename).toBe('breathewise-report-pune-en.pdf');
    expect(model.banners).toHaveLength(2);
    expect(model.evidenceLines[0]).toContain('82');
    expect(model.evidenceLines[2]).toContain('N/A');
    expect(model.recommendationBlocks[0].members).toContain('Pawar Family');
    expect(model.recommendationBlocks[0].reconsider).toBeTruthy();
    expect(model.scheduleBlocks[0].header).toContain('06:00-09:00 -> 09:00-12:00');
    expect(model.limitations).toEqual(['dash_summary_good']);
    expect(model.containsDevanagari).toBe(false);
  });

  it('handles unavailable and derived AQI, member names, and unchanged schedules', () => {
    const plan = makePlan({
      aqiValue: null,
      aqiIsDerived: true,
      aqiBand: 'unavailable',
      isDemoFixture: false,
      isScenario: false,
      recommendations: [
        {
          id: 'rec-2',
          titleKey: 'dash_summary_good',
          titleParams: {},
          applicableMembers: ['Asha', 'Rohan'],
          suggestedActionKey: 'dash_summary_good',
          suggestedActionParams: {},
          reasonGeneratedKey: 'dash_summary_good',
          reasonGeneratedParams: {},
          reconsiderWhenKey: null,
        },
      ] as unknown as ProtectionPlanResult['recommendations'],
      dailyPlan: [
        {
          routineId: 'routine-2',
          routineTitle: 'School commute',
          environment: 'outdoor',
          flexibility: 'fixed',
          originalWindow: '07:00-09:00',
          suggestedWindow: null,
          status: 'proceed_as_planned',
          applicableMembers: ['Asha'],
          rationaleKey: 'dash_summary_good',
          limitationKey: null,
          evidenceTimestamp: null,
        },
      ] as unknown as ProtectionPlanResult['dailyPlan'],
    });

    const model = buildPdfReportModel(household, plan, 'en');
    expect(model.banners).toEqual([]);
    expect(model.evidenceLines[0]).toContain('N/A');
    expect(model.evidenceLines[0]).toContain('dash_derived_note');
    expect(model.recommendationBlocks[0].members).toContain('Asha, Rohan');
    expect(model.recommendationBlocks[0].reconsider).toBeUndefined();
    expect(model.scheduleBlocks[0].header).toContain('07:00-09:00');
    expect(model.scheduleBlocks[0].header).not.toContain('->');
  });

  it('selects the multilingual renderer for Marathi and Hindi or Devanagari content', () => {
    expect(buildPdfReportModel(household, makePlan(), 'mr').containsDevanagari).toBe(true);
    expect(buildPdfReportModel(household, makePlan(), 'hi').containsDevanagari).toBe(true);

    const devanagariHousehold = { ...household, name: 'आशा पवार' };
    expect(
      buildPdfReportModel(devanagariHousehold, makePlan(), 'en').containsDevanagari
    ).toBe(true);
  });
});

describe('exportProtectionPlanPdf', () => {
  it('uses the standard renderer for English and saves the generated file', async () => {
    pdfMocks.renderStandard.mockResolvedValue(undefined);

    await exportProtectionPlanPdf(household, makePlan(), 'en');

    expect(pdfMocks.renderStandard).toHaveBeenCalledTimes(1);
    expect(pdfMocks.ensureFonts).not.toHaveBeenCalled();
    expect(pdfMocks.renderCanvas).not.toHaveBeenCalled();
    expect(pdfMocks.save).toHaveBeenCalledWith('breathewise-report-pune-en.pdf');
  });

  it('loads Devanagari fonts and uses the canvas renderer for Marathi', async () => {
    pdfMocks.ensureFonts.mockResolvedValue(undefined);

    await exportProtectionPlanPdf(household, makePlan(), 'mr');

    expect(pdfMocks.ensureFonts).toHaveBeenCalledTimes(1);
    expect(pdfMocks.renderCanvas).toHaveBeenCalledTimes(1);
    expect(pdfMocks.renderStandard).not.toHaveBeenCalled();
    expect(pdfMocks.save).toHaveBeenCalledWith('breathewise-report-pune-mr.pdf');
  });

  it('falls back to the standard renderer when the document API is unavailable', async () => {
    pdfMocks.renderStandard.mockResolvedValue(undefined);
    vi.stubGlobal('document', undefined);

    await exportProtectionPlanPdf(household, makePlan(), 'hi');

    expect(pdfMocks.ensureFonts).not.toHaveBeenCalled();
    expect(pdfMocks.renderCanvas).not.toHaveBeenCalled();
    expect(pdfMocks.renderStandard).toHaveBeenCalledTimes(1);
    expect(pdfMocks.save).toHaveBeenCalledWith('breathewise-report-pune-hi.pdf');
  });
});
