import { describe, expect, it } from 'vitest';
import type {
  ActivityRoutine,
  FamilyMember,
  HouseholdProfile,
  SavedLocation,
} from '../src/shared/types';
import {
  createInitialFamilyState,
  familyFormReducer,
} from '../src/components/family/familyFormReducer';
import {
  createInitialPlannerState,
  plannerFormReducer,
  TIME_WINDOWS,
} from '../src/components/planner/plannerFormReducer';
import {
  createInitialSimulatorState,
  simulatorReducer,
} from '../src/components/simulator/simulatorReducer';
import {
  INITIAL_LOCATIONS_STATE,
  locationsFormReducer,
} from '../src/components/comparison/locationsFormReducer';

const household = {
  id: 'household-1',
  name: 'Pune Family',
  city: 'Pune',
  locality: 'Kothrud',
  language: 'en',
  sensitivityTags: ['dust_sensitive'],
} as HouseholdProfile;

const member = {
  id: 'member-1',
  householdId: 'household-1',
  name: 'Aarav',
  ageGroup: 'school_child',
  activityPreference: 'outdoor_play',
  routineFlexibility: 'flexible',
  createdAt: '2026-11-24T00:00:00.000Z',
} as FamilyMember;

const routine = {
  id: 'routine-1',
  householdId: 'household-1',
  title: 'Morning walk',
  environment: 'outdoor',
  flexibility: 'flexible',
  preferredWindow: '06:00-09:00',
  memberIds: ['member-1'],
  createdAt: '2026-11-24T00:00:00.000Z',
} as ActivityRoutine;

const location = {
  id: 'location-1',
  householdId: 'household-1',
  city: 'Pune',
  locality: 'Kothrud',
  label: 'Home',
  isPrimary: true,
} as SavedLocation;

describe('family form reducer', () => {
  it('initializes from the household and supports guided mode and step changes', () => {
    const initial = createInitialFamilyState(household, 'members');

    expect(initial).toMatchObject({
      mode: 'members',
      step: 1,
      hhName: 'Pune Family',
      city: 'Pune',
      locality: 'Kothrud',
      language: 'en',
      sensitivityTags: ['dust_sensitive'],
    });
    expect(familyFormReducer(initial, { type: 'setMode', mode: 'guided', step: 2 })).toMatchObject({
      mode: 'guided',
      step: 2,
    });
    expect(familyFormReducer(initial, { type: 'setMode', mode: 'guided' }).step).toBe(1);
    expect(familyFormReducer(initial, { type: 'setStep', step: 3 }).step).toBe(3);
  });

  it('updates fields and toggles sensitivity tags in both directions', () => {
    const initial = createInitialFamilyState(household, 'members');
    const changed = familyFormReducer(initial, {
      type: 'setField',
      field: 'hhName',
      value: 'Updated family',
    });

    expect(changed.hhName).toBe('Updated family');
    expect(
      familyFormReducer(changed, { type: 'toggleSensitivityTag', tag: 'dust_sensitive' })
        .sensitivityTags
    ).toEqual([]);
    expect(
      familyFormReducer(changed, { type: 'toggleSensitivityTag', tag: 'respiratory_comfort' })
        .sensitivityTags
    ).toEqual(['dust_sensitive', 'respiratory_comfort']);
  });

  it('starts and cancels a member edit without discarding the other form state', () => {
    const initial = createInitialFamilyState(household, 'members');
    const editing = familyFormReducer(initial, { type: 'startEditMember', member });

    expect(editing).toMatchObject({
      editingMemberId: 'member-1',
      editName: 'Aarav',
      editAgeGroup: 'school_child',
      editPref: 'outdoor_play',
      editFlex: 'flexible',
    });
    expect(familyFormReducer(editing, { type: 'cancelEditMember' })).toMatchObject({
      editingMemberId: null,
      hhName: 'Pune Family',
    });
  });
});

describe('planner form reducer', () => {
  it('initializes safely with and without family members', () => {
    expect(createInitialPlannerState([member]).selectedMemberIds).toEqual(['member-1']);
    expect(createInitialPlannerState([]).selectedMemberIds).toEqual([]);
    expect(TIME_WINDOWS).toHaveLength(5);
  });

  it('toggles selected and edit members and applies a routine template', () => {
    const initial = createInitialPlannerState([member]);
    const withoutMember = plannerFormReducer(initial, { type: 'toggleMember', id: 'member-1' });
    expect(withoutMember.selectedMemberIds).toEqual([]);
    expect(
      plannerFormReducer(withoutMember, { type: 'toggleMember', id: 'member-2' }).selectedMemberIds
    ).toEqual(['member-2']);

    const withEditMember = plannerFormReducer(initial, {
      type: 'toggleEditMember',
      id: 'member-2',
    });
    expect(withEditMember.editMemberIds).toEqual(['member-2']);
    expect(
      plannerFormReducer(withEditMember, { type: 'toggleEditMember', id: 'member-2' })
        .editMemberIds
    ).toEqual([]);

    expect(
      plannerFormReducer(initial, {
        type: 'applyTemplate',
        title: 'School commute',
        environment: 'outdoor',
        flexibility: 'fixed',
        window: '09:00-12:00',
      })
    ).toMatchObject({
      title: 'School commute',
      environment: 'outdoor',
      flexibility: 'fixed',
      preferredWindow: '09:00-12:00',
    });
  });

  it('loads, cancels, and resets routine editing state', () => {
    const initial = createInitialPlannerState([member]);
    const editing = plannerFormReducer(initial, { type: 'startEdit', routine });

    expect(editing).toMatchObject({
      editingRoutineId: 'routine-1',
      editTitle: 'Morning walk',
      editEnv: 'outdoor',
      editFlex: 'flexible',
      editWindow: '06:00-09:00',
      editNotes: '',
      editMemberIds: ['member-1'],
    });
    expect(plannerFormReducer(editing, { type: 'cancelEdit' }).editingRoutineId).toBeNull();

    const dirty = { ...initial, title: 'Dirty title', notes: 'Dirty notes' };
    expect(plannerFormReducer(dirty, { type: 'resetNewRoutine' })).toMatchObject({
      title: '',
      notes: '',
    });
  });
});

describe('simulator reducer', () => {
  it('uses safe defaults when no current pollutant values or routines exist', () => {
    expect(createInitialSimulatorState([], null, null)).toMatchObject({
      pm25Override: 68,
      pm10Override: 140,
      overrideRoutineId: '',
      result: null,
      running: false,
    });
  });

  it('preserves supplied pollutant values and selects the first routine', () => {
    expect(createInitialSimulatorState([routine], 42, 75)).toMatchObject({
      pm25Override: 42,
      pm10Override: 75,
      overrideRoutineId: 'routine-1',
    });
  });

  it('updates fields and applies numeric overrides and scenario flags', () => {
    const initial = createInitialSimulatorState([routine], 42, 75);
    const updated = simulatorReducer(initial, {
      type: 'setField',
      field: 'label',
      value: 'Custom scenario',
    });
    expect(updated.label).toBe('Custom scenario');

    expect(
      simulatorReducer(initial, {
        type: 'applyPreset',
        mod: {
          label: 'High pollution',
          pm25Override: 120,
          pm10Override: 210,
          aqiOverride: 180,
          simulateStale: true,
          simulateUnavailable: false,
          forecastTrendOverride: 'worsening',
        },
      })
    ).toMatchObject({
      label: 'High pollution',
      usePmOverride: true,
      pm25Override: 120,
      usePm10Override: true,
      pm10Override: 210,
      useAqiOverride: true,
      aqiOverride: 180,
      simulateStale: true,
      simulateUnavailable: false,
      forecastTrendOverride: 'worsening',
      running: true,
    });
  });

  it('preserves omitted PM2.5 overrides and clears optional PM10 and AQI overrides', () => {
    const initial = {
      ...createInitialSimulatorState([routine], 42, 75),
      usePmOverride: false,
      usePm10Override: true,
      useAqiOverride: true,
    };

    expect(
      simulatorReducer(initial, {
        type: 'applyPreset',
        mod: {
          label: 'Unavailable scenario',
          simulateUnavailable: true,
        },
      })
    ).toMatchObject({
      pm25Override: 42,
      usePmOverride: false,
      pm10Override: 75,
      usePm10Override: false,
      aqiOverride: 180,
      useAqiOverride: false,
      simulateUnavailable: true,
      forecastTrendOverride: 'none',
    });
  });
});

describe('locations form reducer', () => {
  it('updates fields, loads an edit, and resets only the add form fields', () => {
    const changed = locationsFormReducer(INITIAL_LOCATIONS_STATE, {
      type: 'set',
      field: 'cityQuery',
      value: 'Pune',
    });
    expect(changed.cityQuery).toBe('Pune');

    const editing = locationsFormReducer(changed, { type: 'startEdit', loc: location });
    expect(editing).toMatchObject({
      editingId: 'location-1',
      editLabel: 'Home',
      editLocality: 'Kothrud',
    });

    expect(
      locationsFormReducer(
        { ...editing, locLabel: 'New location', locality: 'Baner', isPrimary: true },
        { type: 'resetAdd' }
      )
    ).toMatchObject({
      locLabel: '',
      locality: '',
      isPrimary: false,
      editingId: 'location-1',
    });
  });
});
