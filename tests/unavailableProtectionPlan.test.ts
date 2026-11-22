import { describe, expect, it } from 'vitest';
import { generateProtectionPlan } from '../src/engine/intelligence';
import type { ActivityRoutine, FamilyMember, HouseholdProfile } from '../src/shared/types';

const now = '2026-11-22T00:00:00.000Z';
const household: HouseholdProfile = {
  id: 'hh-unavailable-test',
  name: 'Test household',
  city: 'Ahilyanagar',
  locality: 'Savedi',
  language: 'en',
  isDemoProfile: false,
  sensitivityTags: [],
  createdAt: now,
  updatedAt: now,
};
const members: FamilyMember[] = [
  {
    id: 'member-1',
    householdId: household.id,
    name: 'Ashish',
    ageGroup: 'adult',
    activityPreference: 'commute',
    routineFlexibility: 'flexible',
    createdAt: now,
  },
  {
    id: 'member-2',
    householdId: household.id,
    name: 'Manisha',
    ageGroup: 'adult',
    activityPreference: 'morning_walk',
    routineFlexibility: 'flexible',
    createdAt: now,
  },
];
const routines: ActivityRoutine[] = [
  {
    id: 'routine-outdoor',
    householdId: household.id,
    title: 'Daily commute',
    environment: 'outdoor',
    flexibility: 'flexible',
    preferredWindow: '09:00-12:00',
    memberIds: ['member-1'],
    createdAt: now,
  },
  {
    id: 'routine-indoor',
    householdId: household.id,
    title: 'Indoor reading',
    environment: 'indoor',
    flexibility: 'fixed',
    preferredWindow: '19:00-22:00',
    memberIds: ['member-2'],
    createdAt: now,
  },
];

describe('unavailable environmental evidence safeguards', () => {
  it('holds outdoor routines, preserves indoor routines, and never asserts an AQI', () => {
    const plan = generateProtectionPlan({
      household,
      members,
      routines,
      primarySnapshot: null,
      nowIso: now,
    });

    expect(plan.isAvailable).toBe(false);
    expect(plan.aqiValue).toBeNull();
    expect(plan.aqiBand).toBe('unavailable');
    expect(plan.dailyPlan.find((item) => item.routineId === 'routine-outdoor')?.status)
      .toBe('hold_pending_data');
    expect(plan.dailyPlan.find((item) => item.routineId === 'routine-indoor')?.status)
      .toBe('proceed_as_planned');
    expect(plan.dailyPlan.some((item) =>
      item.environment === 'outdoor' && item.status === 'proceed_as_planned'
    )).toBe(false);
    expect(plan.recommendations.map((item) => item.evidenceTrail?.ruleTriggered))
      .toContain('SAFEGUARD_UNAVAILABLE_EVIDENCE');
  });
});
