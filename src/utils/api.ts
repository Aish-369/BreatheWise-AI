import type {
  ActivityRoutine,
  ActivityRoutineInput,
  DataProviderRecord,
  EnvironmentalSnapshot,
  FamilyMember,
  FamilyMemberInput,
  ForecastSlot,
  HouseholdInput,
  HouseholdProfile,
  LocationInput,
  ProtectionPlanResult,
  ProviderAdapterStatus,
  SavedLocation,
  ScenarioComparisonResult,
  ScenarioModification,
  UserSettings,
  UserSettingsInput,
} from '../shared/types';

export interface BootstrapPayload {
  household: HouseholdProfile;
  members: FamilyMember[];
  routines: ActivityRoutine[];
  locations: SavedLocation[];
  settings: UserSettings;
  environment: {
    primarySnapshot: EnvironmentalSnapshot;
    secondarySnapshots: EnvironmentalSnapshot[];
    comparisonCities: {
      pune: EnvironmentalSnapshot[];
      ahilyanagar: EnvironmentalSnapshot[];
      byCity?: Record<string, EnvironmentalSnapshot[]>;
    };
    forecasts: ForecastSlot[];
    providerStatuses: ProviderAdapterStatus[];
    mode: 'live' | 'demo_fixture' | 'unavailable';
  };
  plan: ProtectionPlanResult;
  history: {
    plans: ProtectionPlanResult[];
    scenarios: ScenarioComparisonResult[];
    snapshots: EnvironmentalSnapshot[];
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function apiRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? ((await res.json()) as Record<string, unknown>) : null;

    if (!res.ok) {
      const msg =
        (body && typeof body.error === 'string' && body.error) ||
        `Server responded with HTTP ${res.status}`;
      const code = (body && typeof body.code === 'string' && body.code) || `HTTP_${res.status}`;
      throw new ApiError(res.status, code, msg);
    }

    return (body ?? {}) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(408, 'TIMEOUT', 'Request timed out while contacting local server.');
    }
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      err instanceof Error ? err.message : 'Unable to reach BreatheWise AI server.'
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function fetchBootstrap(opts?: {
  city?: string;
  simulateOutage?: boolean;
  useFixtures?: boolean;
  persist?: boolean;
}): Promise<BootstrapPayload> {
  const params = new URLSearchParams();
  if (opts?.city) params.set('city', opts.city);
  if (typeof opts?.simulateOutage === 'boolean') {
    params.set('simulateOutage', String(opts.simulateOutage));
  }
  if (typeof opts?.useFixtures === 'boolean') {
    params.set('useFixtures', String(opts.useFixtures));
  }
  if (opts?.persist) params.set('persist', 'true');
  const qs = params.toString();
  return apiRequest<BootstrapPayload>(`/api/bootstrap${qs ? `?${qs}` : ''}`);
}

export function saveHouseholdApi(input: HouseholdInput): Promise<{ household: HouseholdProfile }> {
  return apiRequest<{ household: HouseholdProfile }>('/api/household', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function addMemberApi(
  input: FamilyMemberInput
): Promise<{ member: FamilyMember; members: FamilyMember[] }> {
  return apiRequest('/api/members', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMemberApi(
  id: string,
  input: FamilyMemberInput
): Promise<{ member: FamilyMember; members: FamilyMember[] }> {
  return apiRequest(`/api/members/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteMemberApi(
  id: string
): Promise<{ members: FamilyMember[]; routines: ActivityRoutine[] }> {
  return apiRequest(`/api/members/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function addRoutineApi(
  input: ActivityRoutineInput
): Promise<{ routine: ActivityRoutine; routines: ActivityRoutine[] }> {
  return apiRequest('/api/routines', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateRoutineApi(
  id: string,
  input: ActivityRoutineInput
): Promise<{ routine: ActivityRoutine; routines: ActivityRoutine[] }> {
  return apiRequest(`/api/routines/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function toggleRoutineCompletionApi(
  id: string,
  completed: boolean
): Promise<{ routine: ActivityRoutine; routines: ActivityRoutine[] }> {
  return apiRequest(`/api/routines/${encodeURIComponent(id)}/completion`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

export function deleteRoutineApi(id: string): Promise<{ routines: ActivityRoutine[] }> {
  return apiRequest(`/api/routines/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function createLocationApi(
  input: LocationInput
): Promise<{ location: SavedLocation; locations: SavedLocation[] }> {
  return apiRequest('/api/locations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateLocationApi(
  id: string,
  input: LocationInput
): Promise<{ location: SavedLocation; locations: SavedLocation[] }> {
  return apiRequest(`/api/locations/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteLocationApi(id: string): Promise<{ locations: SavedLocation[] }> {
  return apiRequest(`/api/locations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function updateSettingsApi(
  input: UserSettingsInput
): Promise<{ settings: UserSettings; household: HouseholdProfile | null }> {
  return apiRequest('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function fetchProvidersApi(): Promise<{ providers: DataProviderRecord[] }> {
  return apiRequest('/api/providers');
}

export function importCamsApi(
  rawText: string
): Promise<{ importedCount: number; city: string; slots: ForecastSlot[] }> {
  return apiRequest('/api/environment/import-cams', {
    method: 'POST',
    body: JSON.stringify({ rawText }),
  });
}

export function runScenarioApi(
  modification: ScenarioModification,
  opts: { simulateOutage?: boolean; useFixtures?: boolean }
): Promise<ScenarioComparisonResult> {
  return apiRequest('/api/scenarios/run', {
    method: 'POST',
    body: JSON.stringify({
      modification,
      simulateOutage: opts.simulateOutage,
      useFixtures: opts.useFixtures,
    }),
  });
}

export function resetDemoApi(): Promise<BootstrapPayload> {
  return apiRequest('/api/local/reset-demo', { method: 'POST' });
}

export function clearLocalApi(): Promise<{ ok: boolean; cleared: boolean }> {
  return apiRequest('/api/local/clear', { method: 'DELETE' });
}
