// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/i18n/translations';
import type {
  EnvironmentalSnapshot,
  FamilyMember,
  HouseholdProfile,
  ProtectionPlanResult,
} from '../src/shared/types';
import { DashboardView } from '../src/components/DashboardView';
import { HistoryView } from '../src/components/HistoryView';

const pdf = vi.hoisted(() => ({ exportPlan: vi.fn() }));

vi.mock('../src/utils/pdfExport', () => ({
  exportProtectionPlanPdf: pdf.exportPlan,
}));

vi.mock('../src/components/PollutantBreakdownChart', () => ({
  PollutantBreakdownChart: ({ onInspectStation }: { onInspectStation: () => void }) => (
    <button onClick={onInspectStation}>Inspect station</button>
  ),
}));
vi.mock('../src/components/ForecastTrendChart', () => ({
  ForecastTrendChart: () => <div>Forecast chart</div>,
}));
vi.mock('../src/components/dashboard/DashboardHeaderBanners', () => ({
  DashboardHeaderBar: ({
    savingSnapshot,
    savedNotice,
    exportingPdf,
    onSaveSnapshot,
    onExportPdf,
  }: {
    savingSnapshot: boolean;
    savedNotice: boolean;
    exportingPdf: boolean;
    onSaveSnapshot: () => void;
    onExportPdf: () => void;
  }) => (
    <div>
      <button disabled={savingSnapshot} onClick={onSaveSnapshot}>
        {savedNotice ? 'Snapshot saved' : 'Save snapshot'}
      </button>
      <button disabled={exportingPdf} onClick={onExportPdf}>
        Export PDF
      </button>
    </div>
  ),
  DashboardNoticeBanners: () => <div>Dashboard notices</div>,
}));
vi.mock('../src/components/dashboard/DashboardHeroCard', () => ({
  DashboardHeroCard: () => <div>Dashboard hero</div>,
}));
vi.mock('../src/components/dashboard/DashboardSummaryCard', () => ({
  DashboardSummaryCard: ({ onNavigate }: { onNavigate: (tab: string) => void }) => (
    <button onClick={() => onNavigate('family')}>Go to family</button>
  ),
}));
vi.mock('../src/components/dashboard/FamilyMemberCards', () => ({
  FamilyMemberCards: ({ onManageMembers }: { onManageMembers: () => void }) => (
    <button onClick={onManageMembers}>Manage members</button>
  ),
}));
vi.mock('../src/components/dashboard/DashboardTimelineCard', () => ({
  DashboardTimelineCard: ({ onOpenPlanner }: { onOpenPlanner: () => void }) => (
    <button onClick={onOpenPlanner}>Open planner</button>
  ),
}));
vi.mock('../src/components/dashboard/RecommendationsList', () => ({
  RecommendationsList: ({
    expandedRecId,
    onToggleExpand,
    onSelectMemberFilter,
  }: {
    expandedRecId: string | null;
    onToggleExpand: (id: string | null) => void;
    onSelectMemberFilter: (id: string) => void;
  }) => (
    <section>
      <output aria-label="Expanded recommendation">{expandedRecId ?? 'none'}</output>
      <button onClick={() => onToggleExpand('rec-2')}>Expand recommendation</button>
      <button onClick={() => onSelectMemberFilter('member-1')}>Filter for Asha</button>
    </section>
  ),
}));
vi.mock('../src/components/history/HistoryKpiStrip', () => ({
  HistoryKpiStrip: () => <div>History metrics</div>,
}));
vi.mock('../src/components/history/HistoryTables', () => ({
  HistoryPlansAndScenarios: ({
    plans,
    onInspectPlan,
    onExportPdf,
  }: {
    plans: ProtectionPlanResult[];
    onInspectPlan: (plan: ProtectionPlanResult) => void;
    onExportPdf: (plan: ProtectionPlanResult) => void;
  }) => (
    <section>
      <button onClick={() => onInspectPlan(plans[0])}>Inspect saved plan</button>
      <button onClick={() => onExportPdf(plans[0])}>Export saved plan</button>
    </section>
  ),
  HistorySnapshotsTable: () => <div>Snapshot table</div>,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  pdf.exportPlan.mockReset();
});

const household = {
  id: 'household-1',
  name: 'Pawar Family',
  city: 'Pune',
  locality: 'Shivajinagar',
  language: 'en',
  sensitivityTags: [],
} as unknown as HouseholdProfile;

const member = {
  id: 'member-1',
  name: 'Asha',
  ageGroup: 'adult',
  activityPreference: 'morning_walk',
  routineFlexibility: 'flexible',
} as unknown as FamilyMember;

const plan = {
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
    stationOrGridId: 'Pune-1',
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
} as unknown as ProtectionPlanResult;

const snapshot = {
  id: 'snapshot-1',
  city: 'Pune',
  stationOrGridId: 'Pune-1',
  locationLabel: 'Pune station',
  providerLabel: 'CPCB',
  freshness: 'fresh',
  retrievedAt: '2026-11-24T06:00:00.000Z',
  pollutants: { pm25: 42, pm10: 70 },
} as unknown as EnvironmentalSnapshot;

describe('DashboardView actions and navigation', () => {
  it('saves a snapshot, shows a confirmation, and clears it after the notice timeout', async () => {
    vi.useFakeTimers();
    const onSaveSnapshot = vi.fn().mockResolvedValue(undefined);

    render(
      <DashboardView
        lang="en"
        household={household}
        members={[member]}
        plan={plan}
        primarySnapshot={snapshot}
        forecasts={[]}
        onNavigate={vi.fn()}
        onSaveSnapshot={onSaveSnapshot}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save snapshot' }));
      await Promise.resolve();
    });
    expect(onSaveSnapshot).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Snapshot saved' })).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByRole('button', { name: 'Save snapshot' })).toBeTruthy();
  });

  it('surfaces snapshot save failures without swallowing the error message', async () => {
    const onSaveSnapshot = vi.fn().mockRejectedValue(new Error('Snapshot storage failed'));

    render(
      <DashboardView
        lang="en"
        household={household}
        members={[member]}
        plan={plan}
        primarySnapshot={snapshot}
        forecasts={[]}
        onNavigate={vi.fn()}
        onSaveSnapshot={onSaveSnapshot}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save snapshot' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Snapshot storage failed');
  });

  it('exports the current plan and reports PDF failures', async () => {
    pdf.exportPlan.mockResolvedValue(undefined);
    const onNavigate = vi.fn();

    render(
      <DashboardView
        lang="en"
        household={household}
        members={[member]}
        plan={plan}
        primarySnapshot={snapshot}
        forecasts={[]}
        onNavigate={onNavigate}
        onSaveSnapshot={vi.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }));
    await waitFor(() => expect(pdf.exportPlan).toHaveBeenCalledWith(household, plan, 'en'));
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Export PDF' }) as HTMLButtonElement).disabled
      ).toBe(false)
    );

    pdf.exportPlan.mockRejectedValueOnce(new Error('PDF renderer unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }));
    expect((await screen.findByRole('alert')).textContent).toContain('PDF renderer unavailable');
  });

  it('delegates dashboard navigation and recommendation filter/expand state', () => {
    const onNavigate = vi.fn();

    render(
      <DashboardView
        lang="en"
        household={household}
        members={[member]}
        plan={plan}
        primarySnapshot={snapshot}
        forecasts={[]}
        onNavigate={onNavigate}
        onSaveSnapshot={vi.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Go to family' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage members' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inspect station' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open planner' }));
    fireEvent.click(screen.getByRole('button', { name: 'Expand recommendation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filter for Asha' }));

    expect(onNavigate.mock.calls).toEqual([['family'], ['family'], ['air-quality'], ['planner']]);
    expect(screen.getByLabelText('Expanded recommendation').textContent).toBe('rec-2');
  });
});

describe('HistoryView export and inspection workflows', () => {
  it('opens a saved plan and closes the detail dialog with Escape', () => {
    render(
      <HistoryView
        lang="en"
        household={household}
        currentPlan={plan}
        plans={[plan]}
        scenarios={[]}
        snapshots={[]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Inspect saved plan' }));
    expect(screen.getByRole('dialog', { name: t('en', 'ui_modal_plan_detail') })).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: t('en', 'ui_modal_plan_detail') })).toBeNull();
  });

  it('exports the current plan and the selected saved plan', async () => {
    pdf.exportPlan.mockResolvedValue(undefined);

    render(
      <HistoryView
        lang="en"
        household={household}
        currentPlan={plan}
        plans={[plan]}
        scenarios={[]}
        snapshots={[]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_downloadPdf') }));
    await waitFor(() => expect(pdf.exportPlan).toHaveBeenCalledWith(household, plan, 'en'));

    fireEvent.click(screen.getByRole('button', { name: 'Export saved plan' }));
    await waitFor(() => expect(pdf.exportPlan).toHaveBeenCalledTimes(2));
  });

  it('shows a useful error when PDF export fails', async () => {
    pdf.exportPlan.mockRejectedValue(new Error('History PDF failed'));

    render(
      <HistoryView
        lang="en"
        household={household}
        currentPlan={plan}
        plans={[plan]}
        scenarios={[]}
        snapshots={[]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_downloadPdf') }));
    expect((await screen.findByRole('alert')).textContent).toContain('History PDF failed');
  });
});
