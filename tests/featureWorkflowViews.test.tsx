// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/i18n/translations';
import type {
  ActivityRoutine,
  FamilyMember,
  HouseholdProfile,
  ProtectionPlanResult,
  ScenarioComparisonResult,
} from '../src/shared/types';
import { FamilyOnboardingView } from '../src/components/FamilyOnboardingView';
import { PlannerView } from '../src/components/PlannerView';
import { SimulatorView } from '../src/components/SimulatorView';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const household = {
  id: 'household-1',
  name: 'Pawar Family',
  city: 'Pune',
  locality: 'Shivajinagar',
  language: 'en',
  sensitivityTags: [],
  isDemoProfile: false,
  createdAt: '2026-11-24T06:00:00.000Z',
  updatedAt: '2026-11-24T06:00:00.000Z',
} as unknown as HouseholdProfile;

const member = {
  id: 'member-1',
  name: 'Asha',
  ageGroup: 'adult',
  activityPreference: 'morning_walk',
  routineFlexibility: 'flexible',
} as unknown as FamilyMember;

const routine = {
  id: 'routine-1',
  title: 'Morning walk',
  environment: 'outdoor',
  flexibility: 'flexible',
  preferredWindow: '06:00-09:00',
  memberIds: ['member-1'],
  notes: 'Park loop',
} as unknown as ActivityRoutine;

const dailyPlan = [
  {
    routineId: 'routine-1',
    routineTitle: 'Morning walk',
    environment: 'outdoor',
    flexibility: 'flexible',
    originalWindow: '06:00-09:00',
    suggestedWindow: '09:00-12:00',
    status: 'adjust_window',
    applicableMembers: ['Asha'],
    rationaleKey: 'plan_proceed',
    limitationKey: null,
    evidenceTimestamp: '2026-11-24T05:30:00.000Z',
    completedToday: false,
    notes: 'Park loop',
  },
  {
    routineId: 'routine-2',
    routineTitle: 'School commute',
    environment: 'indoor',
    flexibility: 'fixed',
    originalWindow: '06:00-09:00',
    suggestedWindow: null,
    status: 'proceed_with_precautions',
    applicableMembers: ['Asha'],
    rationaleKey: 'plan_proceed',
    limitationKey: null,
    evidenceTimestamp: '2026-11-24T05:30:00.000Z',
    completedToday: false,
  },
] as unknown as ProtectionPlanResult['dailyPlan'];

const plan = {
  id: 'plan-1',
  generatedAt: '2026-11-24T06:00:00.000Z',
  city: 'Pune',
  aqiValue: 82,
  aqiBand: 'satisfactory',
  freshness: 'fresh',
  isAvailable: true,
  isDemoFixture: false,
  isScenario: false,
  recommendations: [],
  dailyPlan,
  limitations: [],
  supportingEvidence: {},
} as unknown as ProtectionPlanResult;

function makeScenario(): ScenarioComparisonResult {
  const baselinePlan = {
    ...plan,
    dailyPlan: [dailyPlan[0]],
  };
  const scenarioPlan = {
    ...plan,
    id: 'scenario-plan',
    isScenario: true,
    dailyPlan: [
      {
        ...dailyPlan[0],
        suggestedWindow: '12:00-16:00',
        status: 'adjust_window',
      },
    ],
  };

  return {
    id: 'scenario-1',
    createdAt: '2026-11-24T06:05:00.000Z',
    isScenario: true,
    disclaimerBanner: 'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT',
    modification: { label: 'PM2.5 spike', pm25Override: 145 },
    baselinePlan,
    scenarioPlan,
    changedRecommendationsCount: 0,
    changedScheduleCount: 1,
    changeSummaryKeys: [],
  } as unknown as ScenarioComparisonResult;
}

describe('FamilyOnboardingView member management', () => {
  it('saves household preferences and adds a new family member', async () => {
    const onSaveHousehold = vi.fn().mockResolvedValue(undefined);
    const onAddMember = vi.fn().mockResolvedValue(undefined);

    render(
      <FamilyOnboardingView
        lang="en"
        household={household}
        members={[member]}
        onSaveHousehold={onSaveHousehold}
        onAddMember={onAddMember}
        onUpdateMember={vi.fn().mockResolvedValue(undefined)}
        onDeleteMember={vi.fn().mockResolvedValue(undefined)}
        onDoneOnboarding={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Household Label'), {
      target: { value: 'Pawar Home' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: t('en', 'sens_dust_sensitive') }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_save') }));

    await waitFor(() =>
      expect(onSaveHousehold).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Pawar Home',
          city: 'Pune',
          sensitivityTags: ['dust_sensitive'],
        })
      )
    );
    expect(screen.getByRole('status').textContent).toContain(t('en', 'action_save'));

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Rohan' } });
    fireEvent.change(screen.getByLabelText('Age Group'), { target: { value: 'school_child' } });
    fireEvent.change(screen.getByLabelText('Primary Activity'), {
      target: { value: 'commute' },
    });
    fireEvent.change(screen.getByLabelText('Routine Flexibility'), {
      target: { value: 'fixed' },
    });
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_add') }));

    await waitFor(() =>
      expect(onAddMember).toHaveBeenCalledWith({
        name: 'Rohan',
        ageGroup: 'school_child',
        activityPreference: 'commute',
        routineFlexibility: 'fixed',
      })
    );
    expect(screen.getByRole('status').textContent).toContain('Rohan added.');
  });

  it('edits an existing member and delegates removal', async () => {
    const onUpdateMember = vi.fn().mockResolvedValue(undefined);
    const onDeleteMember = vi.fn().mockResolvedValue(undefined);

    render(
      <FamilyOnboardingView
        lang="en"
        household={household}
        members={[member]}
        onSaveHousehold={vi.fn().mockResolvedValue(undefined)}
        onAddMember={vi.fn().mockResolvedValue(undefined)}
        onUpdateMember={onUpdateMember}
        onDeleteMember={onDeleteMember}
        onDoneOnboarding={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: `${t('en', 'action_edit')} Asha` }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit member name' }), {
      target: { value: 'Asha Pawar' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Edit age group' }), {
      target: { value: 'older_adult' },
    });
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_save_edit') }));

    await waitFor(() =>
      expect(onUpdateMember).toHaveBeenCalledWith('member-1', {
        name: 'Asha Pawar',
        ageGroup: 'older_adult',
        activityPreference: 'morning_walk',
        routineFlexibility: 'flexible',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove Asha' }));
    expect(onDeleteMember).toHaveBeenCalledWith('member-1');
  });

  it('completes the guided onboarding steps and returns to the overview', async () => {
    const onAddMember = vi.fn().mockResolvedValue(undefined);
    const onDoneOnboarding = vi.fn();

    render(
      <FamilyOnboardingView
        lang="en"
        household={household}
        members={[member]}
        initialMode="guided"
        onSaveHousehold={vi.fn().mockResolvedValue(undefined)}
        onAddMember={onAddMember}
        onUpdateMember={vi.fn().mockResolvedValue(undefined)}
        onDeleteMember={vi.fn().mockResolvedValue(undefined)}
        onDoneOnboarding={onDoneOnboarding}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '02. Family Members' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Member name' }), {
      target: { value: 'Rohan' },
    });
    fireEvent.click(screen.getByRole('button', { name: `+ ${t('en', 'action_add')}` }));

    await waitFor(() => expect(onAddMember).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: '03. Ready' }));
    expect(screen.getByText(t('en', 'ui_family_status_ready'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('en', 'side_overview') }));

    expect(onDoneOnboarding).toHaveBeenCalledTimes(1);
  });
});

describe('PlannerView routine workflows', () => {
  it('creates a routine with the selected member and chosen schedule', async () => {
    const onAddRoutine = vi.fn().mockResolvedValue(undefined);
    const onRecalculatePlan = vi.fn();

    render(
      <PlannerView
        lang="en"
        members={[member]}
        routines={[]}
        plan={{ ...plan, dailyPlan: [] }}
        forecasts={[]}
        onAddRoutine={onAddRoutine}
        onUpdateRoutine={vi.fn().mockResolvedValue(undefined)}
        onToggleCompletion={vi.fn().mockResolvedValue(undefined)}
        onDeleteRoutine={vi.fn().mockResolvedValue(undefined)}
        onRecalculatePlan={onRecalculatePlan}
      />
    );

    fireEvent.change(screen.getByLabelText('Activity Title'), {
      target: { value: 'Evening yoga' },
    });
    fireEvent.change(screen.getByLabelText('Setting'), { target: { value: 'indoor' } });
    fireEvent.change(screen.getByLabelText('Flexibility'), { target: { value: 'fixed' } });
    fireEvent.change(screen.getByLabelText('Preferred Time Window'), {
      target: { value: '19:00-22:00' },
    });
    fireEvent.change(screen.getByLabelText(t('en', 'ui_notes_optional')), {
      target: { value: 'Gentle indoor routine' },
    });

    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_add') }));
    await waitFor(() =>
      expect(onAddRoutine).toHaveBeenCalledWith({
        title: 'Evening yoga',
        environment: 'indoor',
        flexibility: 'fixed',
        preferredWindow: '19:00-22:00',
        memberIds: ['member-1'],
        notes: 'Gentle indoor routine',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_recalculate') }));
    expect(onRecalculatePlan).toHaveBeenCalledTimes(1);
  });

  it('edits a routine, toggles completion, and supports deleting it', async () => {
    const onUpdateRoutine = vi.fn().mockResolvedValue(undefined);
    const onToggleCompletion = vi.fn().mockResolvedValue(undefined);
    const onDeleteRoutine = vi.fn().mockResolvedValue(undefined);

    render(
      <PlannerView
        lang="en"
        members={[member]}
        routines={[routine]}
        plan={plan}
        forecasts={[]}
        onAddRoutine={vi.fn().mockResolvedValue(undefined)}
        onUpdateRoutine={onUpdateRoutine}
        onToggleCompletion={onToggleCompletion}
        onDeleteRoutine={onDeleteRoutine}
        onRecalculatePlan={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: `${t('en', 'action_edit')} Morning walk` }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit activity title' }), {
      target: { value: 'Morning park walk' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Edit setting' }), {
      target: { value: 'indoor' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit routine notes' }), {
      target: { value: 'Use indoor track' },
    });
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_save_edit') }));

    await waitFor(() =>
      expect(onUpdateRoutine).toHaveBeenCalledWith('routine-1', {
        title: 'Morning park walk',
        environment: 'indoor',
        flexibility: 'flexible',
        preferredWindow: '06:00-09:00',
        memberIds: ['member-1'],
        notes: 'Use indoor track',
      })
    );

    const markDoneButtons = screen.getAllByRole('button', { name: t('en', 'ui_mark_completed') });
    fireEvent.click(markDoneButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Morning walk' }));
    expect(onToggleCompletion).toHaveBeenCalledWith('routine-1', true);
    expect(onDeleteRoutine).toHaveBeenCalledWith('routine-1');
  });

  it('filters shifted, precaution, and indoor schedule entries', () => {
    render(
      <PlannerView
        lang="en"
        members={[member]}
        routines={[routine]}
        plan={plan}
        forecasts={[]}
        onAddRoutine={vi.fn().mockResolvedValue(undefined)}
        onUpdateRoutine={vi.fn().mockResolvedValue(undefined)}
        onToggleCompletion={vi.fn().mockResolvedValue(undefined)}
        onDeleteRoutine={vi.fn().mockResolvedValue(undefined)}
        onRecalculatePlan={vi.fn()}
      />
    );

    expect(screen.getByText('Morning walk')).toBeTruthy();
    expect(screen.getByText('School commute')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: t('en', 'ui_filter_shifted') }));
    expect(screen.getByText('Morning walk')).toBeTruthy();
    expect(screen.queryByText('School commute')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: t('en', 'ui_filter_precautions') }));
    expect(screen.getByText('School commute')).toBeTruthy();
    expect(screen.queryByText('Morning walk')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: t('en', 'ui_filter_indoor') }));
    expect(screen.getByText('School commute')).toBeTruthy();
  });
});

describe('SimulatorView scenario workflows', () => {
  it('runs a preset scenario and displays the returned comparison', async () => {
    const onRunScenario = vi.fn().mockResolvedValue(makeScenario());

    render(
      <SimulatorView
        lang="en"
        routines={[routine]}
        currentPm25={42}
        currentPm10={70}
        onRunScenario={onRunScenario}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /PM2\.5 Spike/ }));

    await waitFor(() =>
      expect(onRunScenario).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'What if PM2.5 spikes to 145 µg/m³?',
          pm25Override: 145,
          forecastTrendOverride: 'worsening',
        })
      )
    );
    expect(await screen.findByText('PM2.5 spike')).toBeTruthy();
  });

  it('applies unavailable and stale safeguards to custom scenario overrides', async () => {
    const onRunScenario = vi.fn().mockResolvedValue(makeScenario());

    render(
      <SimulatorView
        lang="en"
        routines={[routine]}
        currentPm25={42}
        currentPm10={70}
        onRunScenario={onRunScenario}
      />
    );

    fireEvent.change(screen.getByLabelText('Scenario Label'), {
      target: { value: 'Sensor outage drill' },
    });
    fireEvent.change(screen.getByRole('slider', { name: 'Hypothetical PM2.5 slider' }), {
      target: { value: '120' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Simulate Stale Sensor (> 6h)' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Simulate Data Unavailable' }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_runScenario') }));

    await waitFor(() =>
      expect(onRunScenario).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Sensor outage drill',
          pm25Override: null,
          pm10Override: null,
          aqiOverride: null,
          simulateStale: true,
          simulateUnavailable: true,
          forecastTrendOverride: 'none',
        })
      )
    );
    expect(await screen.findByText('PM2.5 spike')).toBeTruthy();
  });

  it('omits routine controls when there are no household routines', () => {
    render(
      <SimulatorView
        lang="en"
        routines={[]}
        currentPm25={null}
        onRunScenario={vi.fn().mockResolvedValue(makeScenario())}
      />
    );

    expect(screen.queryByText('Modify a Routine')).toBeNull();
    expect(screen.getByRole('button', { name: /PM2\.5 Spike/ })).toBeTruthy();
  });
});
