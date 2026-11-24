// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/i18n/translations';
import { ScenarioScheduleDiffList } from '../src/components/simulator/ScenarioScheduleDiffList';
import { ScenarioResultPanel } from '../src/components/simulator/ScenarioResultPanel';
import { PlanInspectionModal } from '../src/components/history/PlanInspectionModal';
import type { ProtectionPlanResult, ScenarioComparisonResult } from '../src/shared/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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
    isDemoFixture: false,
    isScenario: false,
    conflictWarningKey: null,
    conflictDetails: null,
    summaryKey: 'dash_summary_good',
    summaryParams: {},
    limitations: [],
    recommendations: [],
    dailyPlan: [],
    supportingEvidence: {
      providerLabel: 'CPCB',
      stationOrGridId: 'station-1',
      dataType: 'physical_station',
      measuredAt: '2026-11-24T05:30:00.000Z',
      retrievedAt: '2026-11-24T06:00:00.000Z',
      freshness: 'fresh',
      pm25: 42,
      pm10: 70,
      aqiValue: 82,
      aqiIsDerived: false,
      isDemoFixture: false,
    },
    ...overrides,
  };
}

const baselineItem = {
  routineId: 'routine-1',
  routineTitle: 'Morning walk',
  environment: 'outdoor' as const,
  flexibility: 'flexible' as const,
  originalWindow: '06:00-09:00' as const,
  suggestedWindow: null,
  status: 'proceed_as_planned' as const,
  applicableMembers: ['member-1'],
  rationaleKey: 'plan_proceed',
  limitationKey: null,
  evidenceTimestamp: '2026-11-24T05:30:00.000Z',
};

function makeScenario(): ScenarioComparisonResult {
  const baselinePlan = makePlan({ dailyPlan: [baselineItem] });
  const scenarioPlan = makePlan({
    id: 'scenario-1',
    isScenario: true,
    dailyPlan: [
      {
        ...baselineItem,
        suggestedWindow: '09:00-12:00',
        status: 'adjust_window',
      },
      {
        ...baselineItem,
        routineId: 'routine-2',
        routineTitle: 'School commute',
        suggestedWindow: null,
        status: 'hold_pending_data',
      },
    ],
  });

  return {
    id: 'scenario-result-1',
    createdAt: '2026-11-24T06:05:00.000Z',
    isScenario: true,
    disclaimerBanner: 'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT',
    modification: { label: 'Worsening afternoon air', pm25Override: 110 },
    baselinePlan,
    scenarioPlan,
    changedRecommendationsCount: 0,
    changedScheduleCount: 2,
    changeSummaryKeys: [],
  };
}

describe('ScenarioScheduleDiffList', () => {
  it('labels changed schedule items and displays shifted time windows', () => {
    render(<ScenarioScheduleDiffList lang="en" result={makeScenario()} />);

    expect(screen.getByRole('heading', { name: 'Resulting Schedule' })).toBeTruthy();
    expect(screen.getByText('2 shifted')).toBeTruthy();
    expect(screen.getByText('Morning walk')).toBeTruthy();
    expect(screen.getByText('School commute')).toBeTruthy();
    expect(screen.getAllByText('(Changed)')).toHaveLength(2);
    expect(screen.getByText(/09:00-12:00/)).toBeTruthy();
  });

  it('does not mark an unchanged schedule item as changed', () => {
    const result = makeScenario();
    result.scenarioPlan.dailyPlan = [baselineItem];
    render(<ScenarioScheduleDiffList lang="en" result={result} />);

    expect(screen.getByText('Morning walk')).toBeTruthy();
    expect(screen.queryByText('(Changed)')).toBeNull();
  });
});

describe('ScenarioResultPanel', () => {
  it('explains that no scenario has been run yet', () => {
    render(<ScenarioResultPanel lang="en" result={null} />);

    expect(screen.getByText('No scenario executed yet')).toBeTruthy();
    expect(screen.queryByText(/NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT/)).toBeNull();
  });

  it('renders the scenario comparison and schedule differences', () => {
    render(<ScenarioResultPanel lang="en" result={makeScenario()} />);

    expect(screen.getByText('Worsening afternoon air')).toBeTruthy();
    expect(screen.getByText('Delta +0 AQI')).toBeTruthy();
    expect(screen.getByText('Resulting Schedule')).toBeTruthy();
    expect(screen.getByText('SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT')).toBeTruthy();
  });
});

describe('PlanInspectionModal', () => {
  it('presents an accessible plan detail dialog and exports the selected plan', () => {
    const plan = makePlan();
    const onClose = vi.fn();
    const onExportPdf = vi.fn();

    render(
      <PlanInspectionModal lang="en" plan={plan} onClose={onClose} onExportPdf={onExportPdf} />
    );

    expect(screen.getByRole('dialog', { name: t('en', 'ui_modal_plan_detail') })).toBeTruthy();
    expect(screen.getByText(/Pune · AQI 82/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_downloadPdf') }));
    expect(onExportPdf).toHaveBeenCalledWith(plan);
    const closeButtons = screen.getAllByRole('button', { name: t('en', 'action_close') });
    expect(closeButtons).toHaveLength(2);
    fireEvent.click(closeButtons[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders unavailable AQI and empty recommendation/schedule sections', () => {
    const plan = makePlan({ aqiValue: null, aqiBand: 'unavailable' });
    render(<PlanInspectionModal lang="en" plan={plan} onClose={vi.fn()} onExportPdf={vi.fn()} />);

    expect(screen.getByText(/AQI N\/A/)).toBeTruthy();
    expect(screen.getByText(t('en', 'dash_actions_heading'))).toBeTruthy();
    expect(screen.getByText(t('en', 'dash_planner_heading'))).toBeTruthy();
  });
});
