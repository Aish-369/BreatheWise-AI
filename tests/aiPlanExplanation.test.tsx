// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FamilyMember, ProtectionPlanResult } from '../src/shared/types';
import { AiPlanExplanationCard } from '../src/components/planner/AiPlanExplanationCard';
import { explainPlanApi } from '../src/utils/api';

vi.mock('../src/utils/api', () => ({
  explainPlanApi: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const plan = {
  id: 'plan-1',
  city: 'Pune',
  aqiValue: 82,
  aqiBand: 'satisfactory',
  freshness: 'fresh',
  dominantPollutant: 'pm25',
  dataType: 'physical_station',
  isAvailable: true,
  isDemoFixture: false,
  supportingEvidence: { pm25: 42, pm10: 70 },
  recommendations: [
    {
      id: 'rec-1',
      titleKey: 'dash_summary_good',
      titleParams: {},
      suggestedActionKey: 'dash_summary_good',
      suggestedActionParams: {},
      reasonGeneratedKey: 'dash_summary_good',
      reasonGeneratedParams: {},
      evidenceTrail: { evidenceMetric: 'PM2.5 42 µg/m³' },
      severity: 'advisory',
    },
  ],
} as unknown as ProtectionPlanResult;

const members = [
  { id: 'member-1', name: 'Private Member Name', ageGroup: 'school_child' },
  { id: 'member-2', name: 'Another Private Name', ageGroup: 'older_adult' },
] as unknown as FamilyMember[];

describe('AiPlanExplanationCard', () => {
  it('requests a grounded explanation without sending member names', async () => {
    vi.mocked(explainPlanApi).mockResolvedValue({
      provider: 'gemini',
      aiEnabled: true,
      model: 'gemini-3.8-flash',
      explanation: 'The supplied forecast supports moving the flexible walk.',
      notice: null,
    });

    render(<AiPlanExplanationCard lang="en" plan={plan} members={members} />);
    fireEvent.click(screen.getByRole('button', { name: 'Explain today’s plan' }));

    await waitFor(() =>
      expect(
        screen.getByText('The supplied forecast supports moving the flexible walk.')
      ).toBeTruthy()
    );

    const [lang, context] = vi.mocked(explainPlanApi).mock.calls[0];
    expect(lang).toBe('en');
    expect(context.householdGroups).toEqual({
      infants: 0,
      children: 1,
      adults: 0,
      olderAdults: 1,
    });
    expect(JSON.stringify(context)).not.toContain('Private Member Name');
    expect(JSON.stringify(context)).not.toContain('Another Private Name');
  });

  it('labels deterministic fallback output and displays the configuration notice', async () => {
    vi.mocked(explainPlanApi).mockResolvedValue({
      provider: 'rules_fallback',
      aiEnabled: false,
      model: null,
      explanation: 'Rule-based plan explanation.',
      notice: 'Gemini is not configured.',
    });

    render(<AiPlanExplanationCard lang="en" plan={plan} members={members} />);
    fireEvent.click(screen.getByRole('button', { name: 'Explain today’s plan' }));

    expect(await screen.findByText('Rule-based plan explanation.')).toBeTruthy();
    expect(screen.getByText('Rules-based fallback')).toBeTruthy();
    expect(screen.getByText('Gemini is not configured.')).toBeTruthy();
  });

  it('ignores a late response for a plan that is no longer displayed', async () => {
    let resolveFirst!: (value: {
      provider: 'gemini';
      aiEnabled: boolean;
      model: string;
      explanation: string;
      notice: null;
    }) => void;
    let resolveSecond!: (value: {
      provider: 'gemini';
      aiEnabled: boolean;
      model: string;
      explanation: string;
      notice: null;
    }) => void;
    vi.mocked(explainPlanApi)
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveFirst = resolve; })
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveSecond = resolve; })
      );

    const { rerender } = render(
      <AiPlanExplanationCard lang="en" plan={plan} members={members} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Explain today’s plan' }));

    const nextPlan = { ...plan, id: 'plan-2' } as ProtectionPlanResult;
    rerender(<AiPlanExplanationCard lang="en" plan={nextPlan} members={members} />);
    fireEvent.click(screen.getByRole('button', { name: 'Explain today’s plan' }));

    resolveFirst({
      provider: 'gemini',
      aiEnabled: true,
      model: 'gemini-3.8-flash',
      explanation: 'Stale explanation from the previous plan.',
      notice: null,
    });
    await waitFor(() => expect(explainPlanApi).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Stale explanation from the previous plan.')).toBeNull();

    resolveSecond({
      provider: 'gemini',
      aiEnabled: true,
      model: 'gemini-3.8-flash',
      explanation: 'Current plan explanation.',
      notice: null,
    });
    expect(await screen.findByText('Current plan explanation.')).toBeTruthy();
  });

  it('shows a safe error message when the API request fails', async () => {
    vi.mocked(explainPlanApi).mockRejectedValue(new Error('SECRET_PROVIDER_ERROR'));

    render(<AiPlanExplanationCard lang="en" plan={plan} members={members} />);
    fireEvent.click(screen.getByRole('button', { name: 'Explain today’s plan' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('The explanation could not be generated');
    expect(alert.textContent).not.toContain('SECRET_PROVIDER_ERROR');
  });
});
